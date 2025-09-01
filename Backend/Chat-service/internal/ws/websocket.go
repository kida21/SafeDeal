package handlers

import (
	"context"
	"chat_service/internal/db"
	"chat_service/internal/escrow"
	"chat_service/internal/model"
	"encoding/json"
	"log"
	"net/http"
	"strconv"
	"strings"
	"sync"
	"time"

	"github.com/gorilla/websocket"
	v0 "github.com/SafeDeal/proto/ai-arbitrator/v0"
	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
)

const (
	// aiArbitratorID is the sender ID for messages from the AI Arbitrator.
	aiArbitratorID = 1
	// disputedStatus represents the final 'disputed' state where a decision is needed.
	disputedStatus = "disputed"
	// mediationStatus represents a temporary state where automatic mediation is needed.
	mediationStatus = "pending_mediation"
)

var (
	upgrader = websocket.Upgrader{
		CheckOrigin: func(r *http.Request) bool {
			return true // Allow all origins (restrict in production)
		},
	}

	// Map escrowID → list of connections
	rooms    = make(map[uint64]map[*websocket.Conn]bool)
	roomsMux sync.Mutex

	// aiClient is the gRPC client for the AI Arbitrator service.
	aiClient *escrow.AiArbitratorClient
)

// init initializes the gRPC client for the AI Arbitrator service.
func init() {
	var err error
	// The gRPC service name within Docker Compose is 'ai-arbitrator-service'.
	// The port is defined in the docker-compose.yml file.
	aiClient, err = escrow.NewAiArbitratorClient("ai-arbitrator-service:50051")
	if err != nil {
		log.Fatalf("failed to create AI Arbitrator client: %v", err)
	}
}

// Message represents a chat message
type Message struct {
	EscrowID  uint   `json:"escrow_id"`
	SenderID  uint   `json:"sender_id"`
	Content   string `json:"content"`
	Timestamp int64  `json:"timestamp"`
}

// NewRouter creates a new chi router with the WebSocket and decision endpoints.
func NewRouter() http.Handler {
	r := chi.NewRouter()
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)

	r.Get("/ws/{escrowID}", HandleWebSocket)
	r.Post("/decision/{escrowID}", HandleDecisionRequest)

	return r
}

// HandleWebSocket handles incoming WebSocket connections and messages for a specific chat room.
func HandleWebSocket(w http.ResponseWriter, r *http.Request) {
	log.Printf("HandleWebSocket: incoming request reached")

	// Check if this is a WebSocket upgrade request
	if strings.ToLower(r.Header.Get("Upgrade")) != "websocket" {
		log.Printf("Not a WebSocket upgrade request")
		http.Error(w, "Expected WebSocket upgrade", http.StatusBadRequest)
		return
	}

	// Extract X-User-ID from header (set by API Gateway)
	userIDStr := r.Header.Get("X-User-ID")
	if userIDStr == "" {
		http.Error(w, "Missing X-User-ID", http.StatusUnauthorized)
		return
	}
	userID, err := strconv.ParseUint(userIDStr, 10, 32)
	if err != nil {
		http.Error(w, "Invalid user ID", http.StatusBadRequest)
		return
	}

	// Extract escrowID from path: /ws/123
	escrowIDStr := chi.URLParam(r, "escrowID")
	escrowID, err := strconv.ParseUint(escrowIDStr, 10, 64)
	if err != nil {
		http.Error(w, "Invalid escrow ID", http.StatusBadRequest)
		return
	}

	// Validate access: escrow must be active and user is buyer/seller
	escrowDetails, err := getEscrowDetails(escrowID)
	if err != nil || escrowDetails == nil {
		http.Error(w, "Failed to get escrow details or access denied", http.StatusForbidden)
		return
	}

	if !(escrowDetails.BuyerId == uint32(userID) || escrowDetails.SellerId == uint32(userID)) {
		http.Error(w, "Access denied", http.StatusForbidden)
		return
	}

	// Upgrade to WebSocket
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Printf("WebSocket upgrade failed: %v", err)
		return
	}
	defer conn.Close()

	// Add connection to room
	roomsMux.Lock()
	if _, ok := rooms[escrowID]; !ok {
		rooms[escrowID] = make(map[*websocket.Conn]bool)
	}
	rooms[escrowID][conn] = true
	roomsMux.Unlock()

	// Remove on exit
	defer func() {
		roomsMux.Lock()
		delete(rooms[escrowID], conn)
		if len(rooms[escrowID]) == 0 {
			delete(rooms, escrowID)
		}
		roomsMux.Unlock()
	}()

	// Send chat history
	loadChatHistory(conn, escrowID)

	// Check for automatic mediation
	if escrowDetails.Status == mediationStatus {
		handleAutomaticMediation(escrowID, escrowDetails)
	}

	// Listen for new messages
	for {
		var msg model.Message
		err := conn.ReadJSON(&msg)
		if err != nil {
			log.Printf("WebSocket read error: %v", err)
			break
		}

		// Set metadata
		msg.EscrowID = uint(escrowID)
		msg.SenderID = uint(userID)
		msg.CreatedAt = time.Now()

		// Save to DB
		db.DB.Create(&msg)

		// Broadcast to room
		broadcastToRoom(escrowID, msg)
	}
}

// HandleDecisionRequest handles an HTTP POST request to get a final AI decision on a disputed escrow.
func HandleDecisionRequest(w http.ResponseWriter, r *http.Request) {
	// Extract escrowID from path
	escrowIDStr := chi.URLParam(r, "escrowID")
	escrowID, err := strconv.ParseUint(escrowIDStr, 10, 64)
	if err != nil {
		http.Error(w, "Invalid escrow ID", http.StatusBadRequest)
		return
	}

	// Get escrow details and validate status
	escrowDetails, err := getEscrowDetails(escrowID)
	if err != nil || escrowDetails == nil || escrowDetails.Status != disputedStatus {
		http.Error(w, "Access denied or escrow not in a disputed state", http.StatusForbidden)
		return
	}

	// Get chat history
	chatHistory := getChatHistory(escrowID)

	// Map chat history to the gRPC message format
	var protoChatMessages []*v1.ChatMessage
	for _, msg := range chatHistory {
		protoChatMessages = append(protoChatMessages, &v1.ChatMessage{
			SenderId: strconv.FormatUint(uint64(msg.SenderID), 10),
			Text:     msg.Content,
		})
	}

	// Prepare the gRPC request body
	disputeConditionsJSON, err := json.Marshal(escrowDetails.DisputeConditions)
	if err != nil {
		log.Printf("Failed to marshal dispute conditions: %v", err)
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	req := &v1.DecisionRequest{
		EscrowId:              escrowDetails.EscrowId,
		Description:           escrowDetails.Description,
		Status:                escrowDetails.Status,
		Amount:                escrowDetails.Amount,
		BuyerId:               escrowDetails.BuyerId,
		SellerId:              escrowDetails.SellerId,
		Chat:                  protoChatMessages,
		DisputeConditionsJson: string(disputeConditionsJSON),
	}

	// Call the gRPC service with a context and timeout
	ctx, cancel := context.WithTimeout(r.Context(), 30*time.Second)
	defer cancel()

	log.Printf("Calling AI Arbitrator for decision on escrow %d", escrowID)
	res, err := aiClient.RequestDecision(ctx, req)
	if err != nil {
		log.Printf("Error during AI decision gRPC call for escrow %d: %v", escrowID, err)
		http.Error(w, "Failed to get AI decision", http.StatusInternalServerError)
		return
	}

	// Construct the message to be saved and broadcasted
	aiMessageContent := "Final Decision: " + res.Decision + "\nJustification: " + res.Justification
	aiMessage := model.Message{
		EscrowID:  uint(escrowID),
		SenderID:  aiArbitratorID,
		Content:   aiMessageContent,
		CreatedAt: time.Now(),
	}

	// Save the AI's message to the chat DB
	db.DB.Create(&aiMessage)

	// Broadcast the new message to all clients in the room
	broadcastToRoom(escrowID, aiMessage)

	w.WriteHeader(http.StatusOK)
	w.Write([]byte("AI decision requested and broadcasted successfully."))
}

// handleAutomaticMediation calls the AI Arbitrator service to get a mediation response and posts it to the chat.
func handleAutomaticMediation(escrowID uint64, escrowDetails *escrow.EscrowResponse) {
	// Map chat history to the gRPC message format
	chatHistory := getChatHistory(escrowID)
	var protoChatMessages []*v1.ChatMessage
	for _, msg := range chatHistory {
		protoChatMessages = append(protoChatMessages, &v1.ChatMessage{
			SenderId: strconv.FormatUint(uint64(msg.SenderID), 10),
			Text:     msg.Content,
		})
	}

	// Prepare the gRPC request body for mediation
	req := &v1.MediationRequest{
		EscrowId:    escrowDetails.EscrowId,
		Description: escrowDetails.Description,
		Chat:        protoChatMessages,
	}

	// Call the gRPC service with a context and timeout
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	log.Printf("Calling AI Arbitrator for mediation on escrow %d", escrowID)
	res, err := aiClient.RequestMediation(ctx, req)
	if err != nil {
		log.Printf("Error during AI mediation gRPC call for escrow %d: %v", escrowID, err)
		return
	}

	// Construct the message to be saved and broadcasted
	aiMessageContent := "Mediation Response: " + res.MediationResponse
	aiMessage := model.Message{
		EscrowID:  uint(escrowID),
		SenderID:  aiArbitratorID,
		Content:   aiMessageContent,
		CreatedAt: time.Now(),
	}

	// Save the AI's message to the chat DB
	db.DB.Create(&aiMessage)

	// Broadcast the new message to all clients in the room
	broadcastToRoom(escrowID, aiMessage)
}

// getEscrowDetails fetches the details of an escrow from the escrow service.
func getEscrowDetails(escrowID uint64) (*escrow.EscrowResponse, error) {
	// The gRPC service name within Docker Compose is 'escrow-service'.
	escrowClient, err := escrow.NewEscrowServiceClient("escrow-service:50052")
	if err != nil {
		log.Printf("Failed to connect to escrow-service: %v", err)
		return nil, err
	}
	defer escrowClient.Close()
	return escrowClient.GetEscrow(uint32(escrowID))
}

// getChatHistory retrieves the chat history for a given escrow from the database.
func getChatHistory(escrowID uint64) []model.Message {
	var messages []model.Message
	db.DB.Where("escrow_id = ?", escrowID).Order("created_at").Find(&messages)
	return messages
}

// loadChatHistory sends the chat history to a newly connected client.
func loadChatHistory(conn *websocket.Conn, escrowID uint64) {
	messages := getChatHistory(escrowID)

	// Convert to Message slice
	msgs := make([]Message, len(messages))
	for i, m := range messages {
		msgs[i] = Message{
			EscrowID:  m.EscrowID,
			SenderID:  m.SenderID,
			Content:   m.Content,
			Timestamp: m.CreatedAt.Unix(),
		}
	}

	if err := conn.WriteJSON(msgs); err != nil {
		log.Printf("Failed to send chat history: %v", err)
	}
}

// broadcastToRoom broadcasts a message to all connected clients in a specific room.
func broadcastToRoom(escrowID uint64, msg model.Message) {
	message := Message{
		EscrowID:  msg.EscrowID,
		SenderID:  msg.SenderID,
		Content:   msg.Content,
		Timestamp: msg.CreatedAt.Unix(),
	}

	roomsMux.Lock()
	defer roomsMux.Unlock()

	for conn := range rooms[escrowID] {
		if err := conn.WriteJSON(message); err != nil {
			log.Printf("Failed to send to client: %v", err)
			conn.Close()
			delete(rooms[escrowID], conn)
		}
	}
}
