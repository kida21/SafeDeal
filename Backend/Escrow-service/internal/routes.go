package internal

import (
    "github.com/gofiber/fiber/v3"
    _"escrow_service/internal/handlers"
    "gorm.io/gorm"
)

func SetupRoutes(app *fiber.App, db *gorm.DB) {
    app.Use(func(c fiber.Ctx) error {
        c.Locals("db", db)
        return c.Next()
    })

    //api := app.Group("/api/escrows")
    // api.Use(middleware.AuthMiddleware())

    // {
    //     api.Post("/", handlers.CreateEscrow)
    //     api.Get("/:id", handlers.GetEscrow)
    //     // Add more routes here
    // }
}