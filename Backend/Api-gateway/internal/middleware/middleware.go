package middleware

import (
	"context"
	"fmt"
	"strings"
	"github.com/SafeDeal/proto/auth/v0"
	"github.com/gofiber/fiber/v3"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"
)

var userServiceClient v0.AuthServiceClient

func init() {
	 opts := []grpc.DialOption{grpc.WithTransportCredentials(insecure.NewCredentials())}
     conn,err := grpc.NewClient("user-service:50051", opts...)
    if err!= nil {
        panic("Failed to create gRPC client")
    }
    userServiceClient = v0.NewAuthServiceClient(conn)
}

func AuthMiddleware() fiber.Handler {
    return func(c fiber.Ctx) error {
        authHeader := c.Get("Authorization")
        if authHeader == "" {
            return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
                "error": "Missing authorization header",
            })
        }

        token := strings.TrimPrefix(authHeader, "Bearer ")
        if token == authHeader {
            return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
                "error": "Invalid token format",
            })
        }

        resp, err := userServiceClient.VerifyToken(context.Background(), &v0.VerifyTokenRequest{Token: token})
        if err != nil || !resp.Valid {
            return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
                "error": "Invalid or expired token",
            })
        }
        c.Request().Header.Set("X-User-ID", fmt.Sprintf("%d", resp.UserId))
        c.Request().Header.Set("X-Session-ID", resp.SessionId)
        return c.Next()
    }
}