package internal

import (
    "github.com/gofiber/fiber/v3"
    "escrow_service/internal/handlers"
    "gorm.io/gorm"
)

func SetupRoutes(app *fiber.App, db *gorm.DB) {
    app.Use(func(c fiber.Ctx) error {
        c.Locals("db", db)
        return c.Next()
    })

   
    api := app.Group("/api/escrows")
    {
    api.Post("/", handlers.CreateEscrow)
    api.Get("/:id", handlers.GetEscrow)
    api.Post("/:id/accept",handlers.AcceptEscrow)
    api.Post("/:id/confirm-receipt", handlers.ConfirmReceipt)
    }
    
}