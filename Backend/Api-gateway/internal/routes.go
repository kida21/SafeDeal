package internal

import (
	"api_gateway/internal/middleware"
	"api_gateway/internal/proxy"
	"api_gateway/internal/ratelimter"
	"time"

	"github.com/gofiber/contrib/websocket"
	"github.com/gofiber/fiber/v2"
)

func SetupRoutes(app *fiber.App) {
	publicLimiter := ratelimter.NewRateLimiter(Client, 50, time.Hour)
	protectedLimiter := ratelimter.NewRateLimiter(Client, 100, time.Hour)

	// Public routes (no auth)
	app.Post("/login", middleware.RateLimitByIP(publicLimiter), proxy.ProxyHandler("user-service"))
	app.Post("/register", middleware.RateLimitByIP(publicLimiter), proxy.ProxyHandler("user-service"))
	app.Get("/activate", middleware.RateLimitByIP(publicLimiter), proxy.ProxyHandler("user-service"))
	app.Post("/refresh-token", middleware.RateLimitByIP(publicLimiter), proxy.ProxyHandler("user-service"))
	app.Post("/resend",middleware.RateLimitByIP(publicLimiter),proxy.ProxyHandler("user-service"))
	

	// Authenticated routes
	authenticated := app.Group("/api")
	authenticated.Use(middleware.AuthMiddleware())
	authenticated.Use(middleware.RateLimitByUser(protectedLimiter))

	{
		// Chat WebSocket
		authenticated.Get("/chat/ws/:id", func(c *fiber.Ctx) error {
	    // Store values in locals for the WebSocket handler
	         c.Locals("user_id", c.Get("X-User-ID"))
	         c.Locals("session_id", c.Get("X-Session-ID"))
	         c.Locals("target_path", "/ws/"+c.Params("id"))
           return websocket.New(proxy.WebSocketProxy("chat-service"))(c)
          })

        // Notification WebSocket
	    authenticated.Get("/notifications/ws", func(c *fiber.Ctx) error {

		     c.Locals("user_id", c.Get("X-User-ID"))
		     c.Locals("session_id", c.Get("X-Session-ID"))
		     return websocket.New(proxy.NotificationProxy("notification-service"))(c)
	     })

		// User routes
		authenticated.Use("/logout", proxy.ProxyHandler("user-service"))
		authenticated.Use("/profile", proxy.ProxyHandler("user-service"))
		authenticated.Use("/updateprofile",proxy.ProxyHandler("user-service"))
		authenticated.Use("/profile/bank-details", proxy.ProxyHandler("user-service"))
		authenticated.Use("/wallet", proxy.ProxyHandler("user-service"))
		authenticated.Use("/users", proxy.ProxyHandler("user-service"))
		authenticated.Use("/search",proxy.ProxyHandler("user-service"))

		// Escrow routes
		authenticated.Use("/escrows", proxy.ProxyHandler("escrow-service"))
		authenticated.Use("/escrows/:id",proxy.ProxyHandler("escrow-service"))
		authenticated.Use("/escrows/my",proxy.ProxyHandler("escrow-service"))
		authenticated.Use("/escrows/:id/accept", proxy.ProxyHandler("escrow-service"))
		authenticated.Use("/escrows/:id/confirm-receipt", proxy.ProxyHandler("escrow-service"))
		authenticated.Use("/escrows/dispute/:id",proxy.ProxyHandler("escrow-service"))
		authenticated.Use("/escrows/contacts",proxy.ProxyHandler("escrow-service"))

		// Payment routes
		authenticated.Use("/payments/initiate", proxy.ProxyHandler("payment-service"))
		authenticated.Use("/payments/transactions",proxy.ProxyHandler("payment-service"))
	}
}
