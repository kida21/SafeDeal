package internal

import (
    "github.com/gofiber/fiber/v3"
    "user_service/internal/handlers"
    "gorm.io/gorm"
)

func SetupRoutes(app *fiber.App, db *gorm.DB) {
    app.Use(func(c fiber.Ctx) error {
        c.Locals("db", db)
        return c.Next()
    })

    auth := app.Group("/auth")
    {
        auth.Post("/register", handlers.Register)
        auth.Post("/login", handlers.Login)
    }

    users := app.Group("/users")
    {
        users.Get("/me", func(c fiber.Ctx) error {
            user := c.Locals("user")
            return c.JSON(user)
        })
    }
}