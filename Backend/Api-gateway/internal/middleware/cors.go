package middleware

import "github.com/gofiber/fiber/v2"

func CORSMiddleware() fiber.Handler {
    allowedOrigins := map[string]bool{
        "http://localhost:3000":        true,
        "https://safe-deal.vercel.app": true,
    }

    return func(c *fiber.Ctx) error {
        origin := c.Get("Origin")

        if allowedOrigins[origin] {
            c.Set("Access-Control-Allow-Origin", origin)
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
