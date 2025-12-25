package handlers

import (
	"fmt"
	"user_service/internal/model"
	"user_service/pkg/mailer"
	"user_service/pkg/validator"
     Token "user_service/pkg/token"
	"github.com/gofiber/fiber/v3"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

func Register(c fiber.Ctx) error {
	type RegisterRequest struct {
		FirstName string `json:"first_name" validate:"required,chars_only,min=2,max=50"`
		LastName  string `json:"last_name" validate:"required,chars_only,min=2,max=50"`
		Email     string `json:"email" validate:"required,email"`
		Password  string `json:"password" validate:"required,min=8"`
		Profession string `json:"profession" validate:"required,min=2,max=100"`
	}

	var req RegisterRequest
	if err := c.Bind().Body(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request"})
	}

	if err := validator.ValidateStruct(req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
	}

	var existingUser model.User
	db := c.Locals("db").(*gorm.DB)
	if err := db.Where("email = ?", req.Email).First(&existingUser).Error; err == nil {
		return c.Status(fiber.StatusConflict).JSON(fiber.Map{
			"error": "Email already in use",
		})
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Could not hash password",
		})
	}

	user := model.User{
		Email:     req.Email,
		FirstName: req.FirstName,
		LastName:  req.LastName,
		Password:  string(hashedPassword),
		Profession: req.Profession,
		Activated: true,
		Version:   1,
		WalletAddress: nil,
		EncryptedPrivateKey: nil,
	}

	if err := db.Create(&user).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to create user in database: " + err.Error(),
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

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"message": "Registration successful. You can login now.",
		"user": fiber.Map{
			"first_name": user.FirstName,
			"last_name":  user.LastName,
			"profession": user.Profession,
			"email":      user.Email,
			"activated":  user.Activated,
		},
	})

}
