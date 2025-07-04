package internal

import (
	"payment_service/internal/handlers"
	"payment_service/internal/middleware"
    "github.com/gofiber/fiber/v3"
	"gorm.io/gorm"
)

func SetupRoutes(app *fiber.App, db *gorm.DB) {
    app.Use(func(c fiber.Ctx) error {
        c.Locals("db", db)
        return c.Next()
    })

    // Public route for Chapa webhook
    app.Post("/api/webhooks/chapa", handlers.HandleChapaWebhook)

    // Protected group
    api := app.Group("/api/payments")
    api.Use(middleware.AuthMiddleware())

    {
        api.Post("/initiate", handlers.InitiateEscrowPayment)
       
    }
}