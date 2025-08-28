package middleware

import (
	"context"
	"fmt"
	"strings"
	"time"

	v0 "github.com/SafeDeal/proto/auth/v0"
	"github.com/gofiber/fiber/v2"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"
)

var userServiceClient v0.AuthServiceClient

func init() {
	opts := []grpc.DialOption{grpc.WithTransportCredentials(insecure.NewCredentials())}
	conn, err := grpc.Dial("user-service:50051", opts...) 
	if err != nil {
		panic("Failed to create gRPC client: " + err.Error())
	}
	userServiceClient = v0.NewAuthServiceClient(conn)
}

func AuthMiddleware() fiber.Handler {
	return func(c *fiber.Ctx) error {

		// Handle CORS preflight
		if c.Method() == "OPTIONS" {
			return c.SendStatus(fiber.StatusOK)
		}

		var token string

		// 1. Check Authorization header
		authHeader := c.Get("Authorization")
		if authHeader != "" {
			if strings.HasPrefix(authHeader, "Bearer ") {
				token = authHeader[7:]
			} else {
				return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
					"error": "Invalid token format",
				})
			}
		}

		// 2. Fallback: Check query parameter (for WebSocket)
		if token == "" {
			token = c.Query("token")
			if token == "" {
				return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
					"error": "Missing authorization token",
				})
			}
		}

		// Set context with timeout
		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()

		// Call user-service for verification
		resp, err := userServiceClient.VerifyToken(ctx, &v0.VerifyTokenRequest{Token: token})
		if err != nil {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"error": "Authentication service error",
			})
		}
		if !resp.Valid {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"error": "Invalid or expired token",
			})
		}

		// Forward user/session info downstream
		c.Request().Header.Set("X-User-ID", fmt.Sprintf("%d", resp.UserId))
		c.Request().Header.Set("X-Session-ID", resp.SessionId)

		return c.Next()
	}
}
