package middleware

import (
	"fmt"
	"os"
	"strings"

	"github.com/gofiber/fiber/v3"
	"github.com/golang-jwt/jwt/v5"
)

func NewJwtMiddleware() fiber.Handler {
    return func(c fiber.Ctx) error {
       

        authHeader := c.Get("Authorization")
        if authHeader == "" {
            fmt.Println("[JWT Middleware] Missing Authorization header")
            return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Missing authorization header"})
        }

        parts := strings.Split(authHeader, " ")
        if len(parts) != 2 || parts[0] != "Bearer" {
            fmt.Println("[JWT Middleware] Invalid token format")
            return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Invalid authorization format"})
        }

        tokenString := parts[1]
        fmt.Println("[JWT Middleware] Token string:", tokenString) //  Log token

        token, err := jwt.Parse(tokenString, func(token *jwt.Token) (any, error) {
            if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
                return nil, fiber.ErrUnauthorized
            }
            return []byte(os.Getenv("JWT_SECRET_KEY")), nil
        })

        if err != nil || !token.Valid {
            fmt.Println("[JWT Middleware] Token invalid:", err) 
            return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Invalid or expired token"})
        }

        c.Locals("user", token)
        fmt.Println("[JWT Middleware] Token set in locals") 

        return c.Next()
    }
}