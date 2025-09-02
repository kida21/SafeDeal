package websockets

import (
	"log"
	"net/http"
	"strconv"
	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true // Allow all origins (restrict in production)
	},
}

func HandleWebSocket(w http.ResponseWriter, r *http.Request) {
	// Extract X-User-ID from header (set by api-gateway proxy)
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

	// Upgrade to WebSocket
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Printf("WebSocket upgrade error: %v", err)
		return
	}
	defer conn.Close()

	// Register connection in Hub
	HubInstance.register <- conn
	HubInstance.mu.Lock()
	HubInstance.clients[conn] = uint(userID)
	HubInstance.mu.Unlock()

	defer func() {
		HubInstance.unregister <- conn
	}()

	// Keep connection alive
	for {
		_, _, err := conn.ReadMessage()
		if err != nil {
			break
		}
	}
}