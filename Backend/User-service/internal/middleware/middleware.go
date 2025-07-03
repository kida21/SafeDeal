package middleware

import (
	"context"
	"os"
	"strings"
    "user_service/pkg/redis"
    "github.com/gofiber/fiber/v3"
	"github.com/golang-jwt/jwt/v5"
)

func NewJwtMiddleware() fiber.Handler {
    return func(c fiber.Ctx) error {
        authHeader := c.Get("Authorization")
        if authHeader == "" {
            return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Missing authorization header"})
        }

        parts := strings.Split(authHeader, " ")
        if len(parts) != 2 || parts[0] != "Bearer" {
            return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Invalid token format"})
        }

        tokenStr := parts[1]
        isRevoked, _ := redisclient.Client.Get(context.Background(), "token:"+tokenStr).Result()
        if isRevoked == "revoked" {
            return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Token revoked"})
        }
        token, err := jwt.Parse(tokenStr, func(t *jwt.Token) (any, error) {
            return []byte(os.Getenv("JWT_SECRET_KEY")), nil
        })

        if err != nil || !token.Valid {
            return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Invalid or expired token"})
        }

        c.Locals("user", token.Claims.(jwt.MapClaims))
        return c.Next()
    }
}