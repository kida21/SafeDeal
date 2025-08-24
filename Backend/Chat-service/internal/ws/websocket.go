package handlers

import (
	"chat_service/internal/db"
	"chat_service/internal/escrow"
	"chat_service/internal/model"
	"log"
	"net/http"
	"strconv"
	"sync"

	"github.com/gorilla/websocket"
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
)

// Message represents a chat message
type Message struct {
	EscrowID  uint   `json:"escrow_id"`
	SenderID  uint   `json:"sender_id"`
	Content   string `json:"content"`
	Timestamp int64  `json:"timestamp"`
}

func HandleWebSocket(w http.ResponseWriter, r *http.Request) {
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
	escrowIDStr := r.URL.Path[len("/ws/"):]
	escrowID, err := strconv.ParseUint(escrowIDStr, 10, 64)
	if err != nil {
		http.Error(w, "Invalid escrow ID", http.StatusBadRequest)
		return
	}

	// Validate access: escrow must be active and user is buyer/seller
	if !isEscrowActive(escrowID, uint(userID)) {
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

		// Save to DB
		db.DB.Create(&msg)

		//  Broadcast to room
		broadcastToRoom(escrowID, msg)
	}
}

func isEscrowActive(escrowID uint64, userID uint) bool {
	escrowClient, err := escrow.NewEscrowServiceClient("escrow-service:50052")
	if err != nil {
		log.Printf("Failed to connect to escrow-service: %v", err)
		return false
	}
	

	resp, err := escrowClient.GetEscrow(uint32(escrowID))
	if err != nil {
		log.Printf("Failed to get escrow from escrow-service: %v", err)
		return false
	}

	if !resp.Active {
		return false
	}

	return resp.BuyerId == uint32(userID) || resp.SellerId == uint32(userID)
}

func loadChatHistory(conn *websocket.Conn, escrowID uint64) {
	var messages []model.Message
	db.DB.Where("escrow_id = ?", escrowID).Order("created_at").Find(&messages)

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