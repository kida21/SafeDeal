package handlers

import (
	
	"strconv"
	"user_service/internal/model"
	"user_service/pkg/validator"

	"github.com/gofiber/fiber/v3"
	"gorm.io/gorm"
)

type UpdateProfileRequest struct {
	FirstName  *string `json:"first_name" validate:"omitempty,chars_only,min=2,max=50"`
	LastName   *string `json:"last_name" validate:"omitempty,chars_only,min=2,max=50"`
	Profession *string `json:"profession" validate:"omitempty,min=2,max=100"`
}

func UpdateProfile(c fiber.Ctx) error {
	userIDStr := c.Get("X-User-ID")
	if userIDStr == "" {
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
			"error": "Missing X-User-ID",
		})
	}

	userID, err := strconv.ParseUint(userIDStr, 10, 32)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid user ID",
		})
	}

	var req UpdateProfileRequest
	if err := c.Bind().Body(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request body"})
	}

	
	if err := validator.ValidateStruct(req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
	}

	db := c.Locals("db").(*gorm.DB)

	
	var user model.User
	if err := db.First(&user, "id = ?", userID).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "User not found"})
	}

	
	if !user.Activated {
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{"error": "Only activated users can update profile"})
	}

	
	updates := make(map[string]interface{})

	if req.FirstName != nil {
		updates["first_name"] = *req.FirstName
	}
	if req.LastName != nil {
		updates["last_name"] = *req.LastName
	}
	if req.Profession != nil {
		updates["profession"] = *req.Profession
	}

	
	if len(updates) == 0 {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "No fields to update. Provide at least one of: first_name, last_name, profession",
		})
	}

	
	updates["version"] = user.Version + 1

	
	if err := db.Model(&user).Updates(updates).Error; err != nil {
		if gorm.ErrDuplicatedKey == err {
			return c.Status(fiber.StatusConflict).JSON(fiber.Map{"error": "Another update is in progress"})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to update profile"})
	}

	
	return c.JSON(fiber.Map{
		"message": "Profile updated successfully",
		"user": fiber.Map{
			"id":         user.ID,
			"first_name":    coalesce(req.FirstName, &user.FirstName),
			"last_name":     coalesce(req.LastName, &user.LastName),
			"profession":    coalesce(req.Profession, &user.Profession),
			"activated":     user.Activated,
			"version":       user.Version + 1,
		},
	})
}


func coalesce(ptr *string, fallback *string) string {
	if ptr != nil {
		return *ptr
	}
	if fallback != nil {
		return *fallback
	}
	return ""
}