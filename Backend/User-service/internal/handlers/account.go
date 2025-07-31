package handlers

import (
	"user_service/internal/model"
	Token "user_service/pkg/token"

	"github.com/gofiber/fiber/v3"
	"gorm.io/gorm"
)

func ActivateAccount(c fiber.Ctx) error {
	token := c.Query("token")
	if token == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Missing activation token",
		})
	}

	db := c.Locals("db").(*gorm.DB)

	email, ok := Token.ValidateActivationToken(token)
	if !ok {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "Invalid or expired token",
		})
	}

	var user model.User
	if err := db.Where("email = ?", email).First(&user).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "User not found"})
	}

	if user.Activated {
		return c.JSON(fiber.Map{
			"message": "Account already activated",
		})
	}
	db.Model(&user).Updates(map[string]any{
		"activated": true,
		"version":   gorm.Expr("version + 1"),
	})
	Token.DeleteActivationToken(token)
	return c.JSON(fiber.Map{
		"message": "Account activated successfully!",
	})
}