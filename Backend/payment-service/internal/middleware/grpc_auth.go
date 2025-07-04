package middleware

import (
	"payment_service/internal/auth"
	"strings"
    "github.com/gofiber/fiber/v3"
)

var userServiceClient, _ = auth.NewUserServiceClient("user-service:50051")

func AuthMiddleware() fiber.Handler {
    return func(c fiber.Ctx) error {
        authHeader := c.Get("Authorization")
        if authHeader == "" {
            return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Missing authorization header"})
        }

        parts := strings.Split(authHeader, " ")
        if len(parts) != 2 || parts[0] != "Bearer" {
            return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Invalid token format"})
        }

        token := parts[1]
        resp, err := userServiceClient.VerifyToken(token)
        if resp == nil || !resp.Valid{
            return c.Status(fiber.StatusServiceUnavailable).JSON(fiber.Map{"error":"nil response from verification or invalid"})
        }
        if err != nil || !resp.Valid {
            return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Invalid or expired token"})
        }
 
        c.Locals("user", map[string]any{
            "user_id":resp.UserId,
            "session_id":resp.SessionId,
        })
        return c.Next()
    }
}