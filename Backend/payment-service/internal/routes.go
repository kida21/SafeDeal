package internal

import (
	"payment_service/internal/handlers"
	"github.com/gofiber/fiber/v3"
	"gorm.io/gorm"
)

func SetupRoutes(app *fiber.App, db *gorm.DB) {
    app.Use(func(c fiber.Ctx) error {
        c.Locals("db", db)
        return c.Next()
    })
    
   app.Post("/webhook/chapa",handlers.HandleChapaWebhook)
   
    // Protected group
    api := app.Group("/api/payments")
    {
        api.Post("/initiate", handlers.InitiateEscrowPayment)
        api.Get("/transactions",handlers.GetTransactionHistory)
    }
}