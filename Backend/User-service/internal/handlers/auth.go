package handlers

import (
	"context"
	"os"
	"strconv"
	"time"
	"user_service/pkg/refresh"
	"user_service/pkg/session"
	"github.com/gofiber/fiber/v3"
	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"github.com/redis/go-redis/v9"

	
)

var redisClient *redis.Client

func SetRedisClient(client *redis.Client) {
    redisClient = client
}



func RefreshToken(c fiber.Ctx) error {
	// Read refresh token from cookie
	refreshToken := c.Cookies("refresh_token")
	if refreshToken == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Missing refresh token",
		})
	}

	valid, oldSessionID := refresh.ValidateRefreshToken(refreshToken)
	if !valid {
		// ✅ Clear invalid cookie
		clearRefreshCookie(c)
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "Invalid or expired refresh token",
		})
	}

	ctx := context.Background()
	val, err := redisClient.Get(ctx, "session:"+oldSessionID).Result()
	if err != nil {
		clearRefreshCookie(c)
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "Session not found",
		})
	}

	userID, err := strconv.Atoi(val)
	if err != nil {
		clearRefreshCookie(c)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Invalid session data",
		})
	}

	// Revoke old session
	session.RevokeSession(oldSessionID)

	// Create new session
	newSessionID := uuid.New().String()
	newSessionKey := "session:" + newSessionID
	err = redisClient.Set(ctx, newSessionKey, userID, 72*time.Hour).Err()
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to create new session",
		})
	}

	// Generate new access token
	claims := CustomClaims{
		UserID: uint32(userID),
		RegisteredClaims: jwt.RegisteredClaims{
			Issuer:    "user-service",
			Subject:   strconv.Itoa(userID),
			ID:        newSessionID,
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(15 * time.Minute)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}

	newToken := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	signedToken, err := newToken.SignedString([]byte(os.Getenv("JWT_SECRET_KEY")))
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to generate access token",
		})
	}

	// Generate new refresh token
	newRefreshToken := refresh.GenerateRefreshToken(newSessionID)
	if newRefreshToken == "" {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to generate refresh token",
		})
	}

	// Update refresh token in cookie
	c.Cookie(&fiber.Cookie{
		Name:     "refresh_token",
		Value:    newRefreshToken,
		Path:     "/",
		MaxAge:   604800,
		Secure:   true,
		HTTPOnly: true,
		SameSite: "None",
	})

	// Revoke old refresh token
	refresh.RevokeRefreshToken(refreshToken)

	// Return new access token only
	return c.JSON(fiber.Map{
		"access_token": signedToken,
		"expires_in":   900,
	})
}

// Helper to clear refresh token cookie
func clearRefreshCookie(c fiber.Ctx) {
	c.Cookie(&fiber.Cookie{
		Name:     "refresh_token",
		Value:    "",
		Path:     "/",
		MaxAge:   -1, // Expire immediately
		Secure:   true,
		HTTPOnly: true,
		SameSite: "None",
	})
}





