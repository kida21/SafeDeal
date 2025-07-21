package internal

import (
	"api_gateway/internal/middleware"
	"api_gateway/internal/proxy"

	"github.com/gofiber/fiber/v3"
)

func SetupRoutes(app *fiber.App) {
    // Public routes (no auth)
    app.Post("/login", proxy.ProxyHandler("user-service"))
    app.Post("/register", proxy.ProxyHandler("user-service"))
    app.Get("/activate", proxy.ProxyHandler("user-service"))

    
    authenticated := app.Group("/api")
    authenticated.Use(middleware.AuthMiddleware())

    {
        authenticated.Use("/users", proxy.ProxyHandler("user-service"))
        authenticated.Use("/escrows", proxy.ProxyHandler("escrow-service"))
        authenticated.Use("/payments", proxy.ProxyHandler("payment-service"))
    }
}