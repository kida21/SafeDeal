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

			var req map[string]interface{}
			if err := json.Unmarshal(msg, &req); err != nil {
				continue
			}

			switch req["type"] {
			case "get_history":
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

			// Handle mark as read
			case "mark_read":
				idFloat, ok := req["id"].(float64)
				if !ok {
					continue
				}
				id := uint(idFloat)

				var notif model.Notification
				if err := DB.First(&notif, "id = ? AND user_id = ?", id, uint(userID)).Error; err != nil {
					continue
				}

				
				notif.Read = true
				DB.Save(&notif)
                //log.Printf("Marked notification %d as read for user %d", id, userID)
				// Broadcast update to all connections of this user
				data, _ := json.Marshal(map[string]interface{}{
					"type": "read_updated",
					"data": map[string]interface{}{
						"id":   notif.ID,
						"read": true,
					},
				})
				HubInstance.Broadcast(Message{
					UserID:  uint(userID),
					Content: data,
				})
			}
		}
	}()

	<-done
	HubInstance.RemoveClient(conn)
}