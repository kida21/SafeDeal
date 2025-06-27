package middleware

import (
	
	"os"
	"strings"
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
        return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Invalid authorization format"})
        }

        tokenString := parts[1]
        token, err := jwt.Parse(tokenString, func(token *jwt.Token) (any, error) {
            if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
                return nil, fiber.ErrUnauthorized
            }
            return []byte(os.Getenv("JWT_SECRET_KEY")), nil
        })

        if err != nil || !token.Valid {
            return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Invalid or expired token"})
        }

        c.Locals("user", token)
        return c.Next()
    }
}