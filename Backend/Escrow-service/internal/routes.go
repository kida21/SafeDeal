package internal

import (
    "github.com/gofiber/fiber/v3"
    "escrow_service/internal/handlers"
    "escrow_service/internal/middleware"
    "gorm.io/gorm"
)

func SetupRoutes(app *fiber.App, db *gorm.DB) {
    app.Use(func(c fiber.Ctx) error {
        c.Locals("db", db)
        return c.Next()
    })

    api := app.Group("/api/escrows")
    api.Use(middleware.AuthMiddleware())

    {
        api.Post("/", handlers.CreateEscrow)
        api.Get("/:id", handlers.GetEscrow)
        //  more routes here
    }
}