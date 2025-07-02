package main

import (
	"payment_service/internal"
	"payment_service/internal/db"
	"payment_service/internal/model"

	"github.com/gofiber/fiber/v3"
)

func main() {
    db.ConnectDB()
    db.DB.AutoMigrate(&model.EscrowPayment{})
    app := fiber.New()
    internal.SetupRoutes(app, db.DB)
   if err := app.Listen(":8083"); err != nil {
        panic("Failed to start Payment Service: " + err.Error())
    }
}