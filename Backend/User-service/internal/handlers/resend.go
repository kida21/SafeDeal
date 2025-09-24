// user_service/internal/handlers/resend_activation.go
package handlers

import (
	"fmt"
	"user_service/internal/model"
	"user_service/pkg/mailer"
	Token "user_service/pkg/token"
	"user_service/pkg/validator"

	"github.com/gofiber/fiber/v3"
	"gorm.io/gorm"
)

type ResendActivationRequest struct {
	Email string `json:"email" validate:"required,email"`
}

func ResendActivation(c fiber.Ctx) error {
	var req ResendActivationRequest
	if err := c.Bind().Body(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	if err := validator.ValidateStruct(req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	db := c.Locals("db").(*gorm.DB)
	var user model.User

	if err := db.Where("email = ?", req.Email).First(&user).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "User not found with this email",
		})
	}

	if user.Activated {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Account is already activated",
		})
	}


	token := Token.GenerateActivationToken(req.Email)
	mailer := mailer.NewMailer()

	
	go func() {
		err := mailer.SendActivationEmail(user.Email, token)
		if err != nil {
			fmt.Println("Failed to send activation email:", err)
		}
	}()

	return c.JSON(fiber.Map{
		"message": "A new activation link has been sent to your email.",
	})
}