package websockets

import (
	"encoding/json"
	"log"
	"net/http"
	"notification_service/internal/model"
	"strconv"

	"github.com/gorilla/websocket"
	"gorm.io/gorm"
)

var DB *gorm.DB

func SetDB(db *gorm.DB) {
	DB = db
}

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true // Allow all origins (use stricter in production)
	},
}

// notification-service/internal/websockets/handler.go
func HandleWebSocket(w http.ResponseWriter, r *http.Request) {
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

	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Printf("Upgrade error: %v", err)
		return
	}
	defer conn.Close()

	HubInstance.AddClient(conn, uint(userID))

	done := make(chan struct{})
	go func() {
		defer close(done)
		for {
			_, msg, err := conn.ReadMessage()
			if err != nil {
				return
			}
			var req map[string]string
			if err := json.Unmarshal(msg, &req); err != nil {
				continue
			}
			if req["type"] == "get_history" {
				var notifications []model.Notification
				DB.Where("user_id = ?", uint(userID)).
					Order("created_at DESC").
					Limit(50).
					Find(&notifications)

				var res []map[string]interface{}
				for _, n := range notifications {
					res = append(res, map[string]interface{}{
						"id":         n.ID,
						"type":       n.Type,
						"title":      n.Title,
						"message":    n.Message,
						"read":       n.Read,
						"created_at": n.CreatedAt.Unix(),
						"metadata":   n.Metadata,
					})
				}

				conn.WriteJSON(map[string]interface{}{
					"type": "history",
					"data": res,
				})
			}
		}
	}()

	<-done
	HubInstance.RemoveClient(conn)
}