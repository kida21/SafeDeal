package internal

import (
	"api_gateway/internal/middleware"
	"api_gateway/internal/proxy"
	"api_gateway/internal/ratelimter"
	"time"

	"github.com/gofiber/fiber/v3"
	"github.com/redis/go-redis/v9"
)
var redisClient *redis.Client
func SetupRoutes(app *fiber.App) {
     
     publicLimiter := ratelimit.NewRateLimiter(redisClient, 50, time.Hour)
    protectedLimiter := ratelimit.NewRateLimiter(redisClient, 100, time.Hour)
    // Public routes (no auth)
    app.Post("/login", middleware.RateLimitByIP(publicLimiter), proxy.ProxyHandler("user-service"))
    app.Post("/register",middleware.RateLimitByIP(publicLimiter), proxy.ProxyHandler("user-service"))
    app.Get("/activate", middleware.RateLimitByIP(publicLimiter),proxy.ProxyHandler("user-service"))

    
    authenticated := app.Group("/api")
    authenticated.Use(middleware.AuthMiddleware())
    authenticated.Use(middleware.RateLimitByUser(protectedLimiter))

    {
        authenticated.Use("/users", proxy.ProxyHandler("user-service"))
        authenticated.Use("/escrows", proxy.ProxyHandler("escrow-service"))
        authenticated.Use("/payments", proxy.ProxyHandler("payment-service"))
    }
}