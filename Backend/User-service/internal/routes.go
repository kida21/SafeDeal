package internal

import (
	"user_service/internal/handlers"
	"user_service/internal/middleware"

	"github.com/gofiber/fiber/v3"
	"gorm.io/gorm"
)

func SetupRoutes(app *fiber.App, db *gorm.DB) {
    app.Use(func(c fiber.Ctx) error {
        c.Locals("db", db)
        return c.Next()
    })

    // Public routes
    app.Post("/register", handlers.Register)
    app.Post("/login", handlers.Login)
    api := app.Group("/api")
    api.Use(middleware.NewJwtMiddleware())
     {
        api.Get("/profile", handlers.Profile)
     }
}