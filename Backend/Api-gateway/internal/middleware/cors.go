package middleware

import "github.com/gofiber/fiber/v3"

func CORSMiddleware() fiber.Handler {
    return func(c fiber.Ctx) error {
        c.Set("Access-Control-Allow-Origin", "http://localhost:3000")
        c.Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
        c.Set("Access-Control-Allow-Headers", "Origin, Content-Type, Accept, Authorization")
        c.Set("Access-Control-Allow-Credentials", "true")

        if c.Method() == "OPTIONS" {
            return c.SendStatus(200)
        }

        return c.Next()
    }
}