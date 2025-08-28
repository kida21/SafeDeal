package main

import (
	"chat_service/internal/consul"
	"chat_service/internal/db"
	"chat_service/internal/model"
	handlers "chat_service/internal/ws"
	"log"
	"net/http"
)

func main() {
	
	db.ConnectDB()
    db.DB.AutoMigrate(&model.Message{})
    consul.RegisterService("chat-service", "chat-service", 8085)
	http.HandleFunc("/ws/", handlers.HandleWebSocket)

	http.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		w.Write([]byte("OK"))
	})
    log.Println("Chat service is running on :8085")
	if err := http.ListenAndServe(":8085", nil); err != nil {
		log.Fatalf("Failed to start chat service: %v", err)
	}
}