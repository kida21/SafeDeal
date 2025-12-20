package middleware

import "github.com/gofiber/fiber/v2"

func CORSMiddleware() fiber.Handler {
    allowedOrigins := []string{
        "https://safe-deal.vercel.app",
        "https://elida-necktieless-unaspiringly.ngrok-free.dev",
    }

    return func(c *fiber.Ctx) error {
        origin := c.Get("Origin")

        // Allow only exact origins
        for _, allowedOrigin := range allowedOrigins {
            if origin == allowedOrigin {
                c.Set("Access-Control-Allow-Origin", allowedOrigin)
                break
            }
        }

        c.Set("Vary", "Origin")
        c.Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS, PATCH")
        c.Set("Access-Control-Allow-Headers", "Origin, Content-Type, Accept, Authorization, X-User-ID, ngrok-skip-browser-warning")
        c.Set("Access-Control-Allow-Credentials", "true")

        // For preflight requests, return immediately *after* setting headers
        if c.Method() == "OPTIONS" {
            return c.SendStatus(fiber.StatusNoContent) // 204 is common
        }

        return c.Next()
    }
}
