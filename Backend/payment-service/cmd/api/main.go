package main

import (
	"payment_service/internal"
	"payment_service/internal/consul"
	"payment_service/internal/db"
	"payment_service/internal/model"

	"github.com/gofiber/fiber/v3"
)

func main() {
    db.ConnectDB()
    db.DB.AutoMigrate(&model.EscrowPayment{})
    consul.RegisterService("payment-service", "payment-service", 8083)
    app := fiber.New()

    app.Get("/health", func(c fiber.Ctx) error {
        return c.SendString("OK")
    })
    internal.SetupRoutes(app, db.DB)
    
   if err := app.Listen(":8083"); err != nil {
        panic("Failed to start Payment Service: " + err.Error())
    }
}