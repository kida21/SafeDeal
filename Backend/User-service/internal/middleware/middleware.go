package middleware

import (
	"os"
	"strconv"
	"strings"
	"user_service/pkg/session"
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

        token, err := jwt.Parse(tokenStr, func(t *jwt.Token) (interface{}, error) {
            return []byte(os.Getenv("JWT_SECRET_KEY")), nil
        })

        if err != nil || !token.Valid {
            return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Invalid or expired token"})
        }

        claims := token.Claims.(jwt.MapClaims)

        sessionID := claims["jti"].(string)
        userIDFloat, _ := strconv.ParseUint(claims["sub"].(string), 10, 64)
        userID := uint(userIDFloat)

        if !session.ValidateSession(sessionID, userID) {
            return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Session revoked"})
        }

        c.Locals("user", map[string]any{
            "session_id": sessionID,
            "user_id":    userID,
        })

        return c.Next()
    }

}