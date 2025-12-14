package middleware

import "github.com/gofiber/fiber/v2"

func CORSMiddleware() fiber.Handler {
    allowedOrigin := "https://safe-deal.vercel.app"

    return func(c *fiber.Ctx) error {
        origin := c.Get("Origin")

        // Allow only the exact origin
        if origin == allowedOrigin {
            c.Set("Access-Control-Allow-Origin", allowedOrigin)
        }

        c.Set("Vary", "Origin")
        c.Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS, PATCH")
        c.Set("Access-Control-Allow-Headers", "Origin, Content-Type, Accept, Authorization, X-User-ID, ngrok-skip-browser-warning")
        c.Set("Access-Control-Allow-Credentials", "true")

        if c.Method() == "OPTIONS" {
            return c.SendStatus(200)
        }

        return c.Next()
    }
}
