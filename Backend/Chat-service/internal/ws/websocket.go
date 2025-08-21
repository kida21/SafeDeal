package ws

import (
	"chat_service/internal/db"
	"chat_service/internal/escrow"
	"chat_service/internal/model"
	"encoding/json"
	"log"
	"strconv"
	"sync"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/websocket/v2"
)

var (
	clients = make(map[*websocket.Conn]bool)
	mu      sync.Mutex
)

func HandleWebSocket(c *websocket.Conn) {
	escrowIDStr := c.Params("id")
	escrowID, err := strconv.ParseUint(escrowIDStr, 10, 64)
	if err != nil {
		c.WriteJSON(fiber.Map{"error": "Invalid escrow ID"})
		c.Close()
		return
	}

	userIDStr := c.Query("user_id")
	userID, err := strconv.ParseUint(userIDStr, 10, 32)
	if err != nil {
		c.WriteJSON(fiber.Map{"error": "Invalid user ID"})
		c.Close()
		return
	}

	
	if !isEscrowActive(uint(escrowID), uint(userID)) {
		c.WriteJSON(fiber.Map{"error": "Access denied"})
		c.Close()
		return
	}

	mu.Lock()
	clients[c] = true
	mu.Unlock()

	defer func() {
		mu.Lock()
		delete(clients, c)
		mu.Unlock()
		c.Close()
	}()

	
	loadChatHistory(c, uint(escrowID))

	for {
		var msg model.Message
		if err := c.ReadJSON(&msg); err != nil {
			break
		}

		msg.EscrowID = uint(escrowID)
		msg.SenderID = uint(userID)

		
		db.DB.Create(&msg)

		
		broadcastMessage(msg)
	}
}

func isEscrowActive(escrowID, userID uint) bool {
	escrowClient, err := escrow.NewEscrowServiceClient("escrow-service:50052")
	if err != nil {
		log.Printf("Failed to connect to escrow-service: %v", err)
		return false
	}
	resp, err := escrowClient.GetEscrow(uint32(escrowID))
	if err != nil {
		log.Printf("Failed to get escrow: %v", err)
		return false
	}

	if !resp.Active {
		return false
	}

	return resp.BuyerId == uint32(userID) || resp.SellerId == uint32(userID)
}

func loadChatHistory(c *websocket.Conn, escrowID uint) {
	var messages []model.Message
	db.DB.Where("escrow_id = ?", escrowID).Order("created_at").Find(&messages)
	c.WriteJSON(messages)
}

func broadcastMessage(msg model.Message) {
	data, _ := json.Marshal(msg)
	mu.Lock()
	defer mu.Unlock()
	for client := range clients {
		if err := client.WriteJSON(data); err != nil {
			client.Close()
			delete(clients, client)
		}
	}
}

