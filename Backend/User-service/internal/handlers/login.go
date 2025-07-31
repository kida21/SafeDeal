package handlers

import (
	"os"
	"strconv"
	"time"
	"user_service/internal/model"
	"user_service/pkg/refresh"
	"user_service/pkg/session"

	"github.com/gofiber/fiber/v3"
	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

func Login(c fiber.Ctx) error {
	type Request struct {
		Email    string `json:"email"`
		Password string `json:"password"`
	}

	var req Request
	if err := c.Bind().Body(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request"})
	}

	db := c.Locals("db").(*gorm.DB)
	var user model.User

	if err := db.Where("email = ?", req.Email).First(&user).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "User not found"})
	}

	if !user.Activated {
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
			"error": "Account not activated. Please check your email.",
		})
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(req.Password)); err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Invalid credentials"})
	}

	// Revoke all existing sessions & refresh tokens
	session.RevokeAllSessionsForUser(user.ID)
	refresh.RevokeAllRefreshTokensForUser(user.ID)

	// Generate session ID
	sessionID := session.GenerateSessionID(user.ID)

	// Generate refresh token linked to session ID
	refreshToken := refresh.GenerateRefreshToken(sessionID)

	// Create access token with session ID
	claims := CustomClaims{
		UserID: uint32(user.ID),
		RegisteredClaims: jwt.RegisteredClaims{
			Issuer:    "user-service",
			Subject:   strconv.Itoa(int(user.ID)),
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(15 * time.Minute)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			ID:        sessionID,
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	signedToken, _ := token.SignedString([]byte(os.Getenv("JWT_SECRET_KEY")))

	return c.JSON(fiber.Map{
		"access_token":  signedToken,
		"refresh_token": refreshToken,
	})
}
