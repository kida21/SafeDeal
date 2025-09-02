package websockets

import (
	"sync"

	"github.com/gorilla/websocket"
)

type Hub struct {
	clients    map[*websocket.Conn]uint
	register   chan *websocket.Conn
	unregister chan *websocket.Conn
	broadcast  chan Message
	mu         sync.RWMutex
}

type Message struct {
	UserID  uint   `json:"user_id"`
	Content []byte `json:"content"`
}

var HubInstance = &Hub{
	clients:    make(map[*websocket.Conn]uint),
	register:   make(chan *websocket.Conn),
	unregister: make(chan *websocket.Conn),
	broadcast:  make(chan Message),
}
func (h *Hub) Broadcast(message Message) {
	h.broadcast <- message
}

func (h *Hub) Run() {
	for {
		select {
		case conn := <-h.register:
			h.mu.Lock()
			h.clients[conn] = 0
			h.mu.Unlock()

		case conn := <-h.unregister:
			h.mu.Lock()
			delete(h.clients, conn)
			h.mu.Unlock()

		case message := <-h.broadcast:
			h.mu.RLock()
			for conn, uid := range h.clients {
				if uid == message.UserID {
					conn.WriteMessage(websocket.TextMessage, message.Content)
				}
			}
			h.mu.RUnlock()
		}
	}
}