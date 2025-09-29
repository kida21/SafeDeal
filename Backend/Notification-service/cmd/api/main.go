package main

import (
	"log"
	"net/http"
	"notification_service/internal/consul"
	"notification_service/internal/consumer"
	"notification_service/internal/db"
	"notification_service/internal/model"
	"notification_service/internal/websockets"
)

func main() {
	db.ConnectDB()
	db.DB.AutoMigrate(&model.Notification{})
	websockets.SetDB(db.DB)
    consul.RegisterService("notification-service", "notification-service", 8086)
    go websockets.HubInstance.Run()
    cons := consumer.NewConsumer(db.DB)
	go cons.Listen()

	
	http.HandleFunc("/ws/notifications", websockets.HandleWebSocket)
	
	http.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		w.Write([]byte("OK"))
	})

	log.Println("🚀 Notification service running on :8086")
	log.Fatal(http.ListenAndServe(":8086", nil))
}