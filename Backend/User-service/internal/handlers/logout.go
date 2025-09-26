package handlers

import (
	"user_service/pkg/refresh"
	"user_service/pkg/session"

	"github.com/gofiber/fiber/v3"
)

func Logout(c fiber.Ctx) error {
	refreshToken := c.Cookies("refresh_token")
	if refreshToken != "" {
		// Revoke from Redis
		valid, sessionID := refresh.ValidateRefreshToken(refreshToken)
		if valid {
			refresh.RevokeRefreshToken(refreshToken)
			session.RevokeSession(sessionID)
		}
	}

	// Clear cookie
	clearRefreshCookie(c)
	return c.JSON(fiber.Map{"message": "Logged out successfully"})
}