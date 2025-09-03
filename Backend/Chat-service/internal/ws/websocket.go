package handlers

import (
    "context"
    "chat_service/internal/db"
    "chat_service/internal/ai_mediator"
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
    v1_ai "github.com/SafeDeal/proto/ai-arbitrator/v1"
    v1_escrow "github.com/SafeDeal/proto/escrow/v1"
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

    // AiUserId is 1, as requested.
    AiUserId uint = 1
)

// Message represents a chat message for WebSocket communication
type Message struct {
    EscrowID  uint   `json:"escrow_id"`
    SenderID  uint   `json:"sender_id"`
    Content   string `json:"content"`
    Timestamp int64  `json:"timestamp"`
}

// HandleWebSocket handles the initial WebSocket connection and chat messaging.
func HandleWebSocket(w http.ResponseWriter, r *http.Request) {
    log.Printf("HandleWebSocket: incoming request reached")

    if strings.ToLower(r.Header.Get("Upgrade")) != "websocket" {
        log.Printf("Not a WebSocket upgrade request")
        http.Error(w, "Expected WebSocket upgrade", http.StatusBadRequest)
        return
    }

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

    escrowIDStr := r.URL.Path[len("/ws/"):]
    
    escrowID, err := strconv.ParseUint(escrowIDStr, 10, 64)
    if err != nil {
        log.Printf("Failed to parse escrow ID: %v", err)
        http.Error(w, "Invalid escrow ID", http.StatusBadRequest)
        return
    }

    escrowDetails, err := getEscrowDetails(escrowID, uint(userID))
    if err != nil {
        http.Error(w, err.Error(), http.StatusForbidden)
        return
    }

    // If the escrow is disputed, trigger automated AI mediation
    if escrowDetails.Status == "Disputed" {
        go triggerAutomatedMediation(escrowDetails, escrowID)
    }

    conn, err := upgrader.Upgrade(w, r, nil)
    if err != nil {
        log.Printf("WebSocket upgrade failed: %v", err)
        return
    }
    defer conn.Close()

    roomsMux.Lock()
    if _, ok := rooms[escrowID]; !ok {
        rooms[escrowID] = make(map[*websocket.Conn]bool)
    }
    rooms[escrowID][conn] = true
    roomsMux.Unlock()

    defer func() {
        roomsMux.Lock()
        delete(rooms[escrowID], conn)
        if len(rooms[escrowID]) == 0 {
            delete(rooms, escrowID)
        }
        roomsMux.Unlock()
    }()

    loadChatHistory(conn, escrowID)

    for {
        var msg model.Message
        err := conn.ReadJSON(&msg)
        if err != nil {
            log.Printf("WebSocket read error: %v", err)
            break
        }

        msg.EscrowID = uint(escrowID)
        msg.SenderID = uint(userID)
        db.DB.Create(&msg)
        broadcastToRoom(escrowID, msg)
    }
}

// HandleDecision handles the request to get an AI decision on an escrow dispute.
func HandleDecision(w http.ResponseWriter, r *http.Request) {
    log.Printf("HandleDecision: incoming request reached")

    if r.Method != http.MethodPost {
        http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
        return
    }

    // Extract escrowID from path: /decision/123
    escrowIDStr := strings.TrimPrefix(r.URL.Path, "/decision/")
    escrowID, err := strconv.ParseUint(escrowIDStr, 10, 64)
    if err != nil {
        log.Printf("Failed to parse escrow ID from path: %v", err)
        http.Error(w, "Invalid escrow ID", http.StatusBadRequest)
        return
    }

    // Fetch all messages for the escrow
    var messages []model.Message
    db.DB.Where("escrow_id = ?", escrowID).Order("created_at").Find(&messages)

    // Prepare the chat log for the AI service
    chatLog := []*v1_ai.ChatMessage{}
    for _, msg := range messages {
        chatLog = append(chatLog, &v1_ai.ChatMessage{
            SenderId: strconv.FormatUint(uint64(msg.SenderID), 10),
            Text:     msg.Content,
        })
    }
    
    escrowDetails, err := getEscrowDetails(escrowID, 0) // UserID is not needed for this call
    if err != nil {
        log.Printf("Failed to get escrow details: %v", err)
        http.Error(w, "Failed to get escrow details", http.StatusInternalServerError)
        return
    }

    // Create AI client
    client, err := ai_mediator.NewAiArbitratorClient("ai-arbitrator-service:50055")
    if err != nil {
        log.Printf("Failed to create AI arbitrator client: %v", err)
        http.Error(w, "Failed to connect to AI service", http.StatusInternalServerError)
        return
    }
    defer client.Close()

    // Create the decision request
    req := &v1_ai.DecisionRequest{
        EscrowId:         strconv.FormatUint(escrowID, 10),
        Description:      escrowDetails.Conditions,
        Status:           escrowDetails.Status,
        Amount:           escrowDetails.Amount,
        BuyerId:          strconv.FormatUint(uint64(escrowDetails.BuyerId), 10),
        SellerId:         strconv.FormatUint(uint64(escrowDetails.SellerId), 10),
        Chat:             chatLog,
        DisputeConditionsJson: "{}", // Add empty JSON object as placeholder
    }

    ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
    defer cancel()

    // Request a decision from the AI
    resp, err := client.RequestDecision(ctx, req)
    if err != nil {
        log.Printf("Failed to request decision from AI: %v", err)
        http.Error(w, "Failed to get decision from AI", http.StatusInternalServerError)
        return
    }

    // Respond with the AI's decision
    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(map[string]string{
        "decision":     resp.Decision,
        "justification": resp.Justification,
    })
}

// getEscrowDetails checks access and returns escrow details.
func getEscrowDetails(escrowID uint64, userID uint) (*v1_escrow.EscrowResponse, error) {
    escrowClient, err := escrow.NewEscrowServiceClient("escrow-service:50052")
    if err != nil {
        log.Printf("Failed to connect to escrow-service: %v", err)
        return nil, http.ErrAbortHandler
    }
    
    resp, err := escrowClient.GetEscrow(uint32(escrowID))
    if err != nil {
        log.Printf("Failed to get escrow from escrow-service: %v", err)
        return nil, http.ErrAbortHandler
    }

    if !resp.Active || (resp.Status != "disputed" && resp.BuyerId != uint32(userID) && resp.SellerId != uint32(userID)) {
        return nil, http.ErrAbortHandler
    }

    return resp, nil
}

// triggerAutomatedMediation sends a request to the AI service and broadcasts the response.
func triggerAutomatedMediation(escrowDetails *v1_escrow.EscrowResponse, escrowID uint64) {
    // Check if an AI message already exists in the chat history for this escrow.
    var existingAiMessage model.Message
    result := db.DB.Where("escrow_id = ? AND sender_id = ?", escrowID, AiUserId).First(&existingAiMessage)
    
    // If a message from the AI is found, do nothing and return.
    if result.Error == nil {
        log.Printf("AI has already mediated for escrow %d. Skipping mediation.", escrowID)
        return
    }

    // Create AI client
    client, err := ai_mediator.NewAiArbitratorClient("ai-arbitrator-service:50055")
    if err != nil {
        log.Printf("Failed to create AI arbitrator client: %v", err)
        return
    }
    defer client.Close()
    
    // Create the mediation request
    req := &v1_ai.MediationRequest{
        EscrowId:    strconv.FormatUint(escrowID, 10),
        Description: escrowDetails.Conditions,
        Status:      escrowDetails.Status,
        Chat:        []*v1_ai.ChatMessage{}, // Initialize empty chat
    }

    ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
    defer cancel()

    // Request mediation from the AI
    resp, err := client.RequestMediation(ctx, req)
    if err != nil {
        log.Printf("Failed to request mediation from AI: %v", err)
        return
    }

    // Create a new message from the AI service
    aiMessage := model.Message{
        EscrowID: uint(escrowID),
        SenderID: AiUserId,
        Content:  resp.Message,
    }

    // Save and broadcast the AI's message
    db.DB.Create(&aiMessage)
    broadcastToRoom(escrowID, aiMessage)
}

func loadChatHistory(conn *websocket.Conn, escrowID uint64) {
    var messages []model.Message
    db.DB.Where("escrow_id = ?", escrowID).Order("created_at").Find(&messages)

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
