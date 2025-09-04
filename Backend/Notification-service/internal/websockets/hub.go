package websockets

import (
	"encoding/json"
	"log"
	"sync"

	"github.com/gorilla/websocket"
)

type Hub struct {
	clients   map[*websocket.Conn]uint
	broadcast chan Message
	mu        sync.RWMutex
}

type Message struct {
	UserID  uint   `json:"user_id"`
	Content []byte `json:"content"`
}

var HubInstance = &Hub{
	clients:   make(map[*websocket.Conn]uint),
	broadcast: make(chan Message),
}

func (h *Hub) Broadcast(message Message) {
	h.broadcast <- message
}

func (h *Hub) AddClient(conn *websocket.Conn, userID uint) {
	h.mu.Lock()
	h.clients[conn] = userID
	h.mu.Unlock()
	log.Printf("Client added: %p for user %d", conn, userID)
}

func (h *Hub) RemoveClient(conn *websocket.Conn) {
	h.mu.Lock()
	delete(h.clients, conn)
	h.mu.Unlock()
	log.Printf("Client removed: %p", conn)
}

func (h *Hub) Run() {
	for message := range h.broadcast {
		h.mu.RLock()
		for conn, uid := range h.clients {
			if uid == message.UserID {
				// Wrap message inside a JSON envelope
				payload := map[string]interface{}{
					"type": "notification",
					"data": json.RawMessage(message.Content),
				}
				encoded, err := json.Marshal(payload)
				if err != nil {
					log.Printf("Error marshalling payload: %v", err)
					continue
				}

				if err := conn.WriteMessage(websocket.TextMessage, encoded); err != nil {
					log.Printf("Error sending to client: %v", err)
					conn.Close()
					h.RemoveClient(conn)
				}
			}
		}
		h.mu.RUnlock()
	}
}
