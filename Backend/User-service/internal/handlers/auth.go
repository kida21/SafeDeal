package handlers

import (
	"os"
	"time"
	"user_service/internal/model"

	"github.com/gofiber/fiber/v3"
	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

var jwtSecret = os.Getenv("JWT_SECRET_KEY")

func Register(c fiber.Ctx) error {
    user := new(model.User)

    if err := c.Bind().Body(user); err != nil {
        return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
    }

    db := c.Locals("db").(*gorm.DB)

    hashedPassword, _ := bcrypt.GenerateFromPassword([]byte(user.Password), bcrypt.DefaultCost)
    user.Password = string(hashedPassword)

    db.Create(&user)

    return c.Status(fiber.StatusCreated).JSON(fiber.Map{"message": "User registered"})
}

func Login(c fiber.Ctx) error {
    type LoginInput struct {
        Email    string `json:"email"`
        Password string `json:"password"`
    }

    var input LoginInput
    if err := c.Bind().Body(&input); err != nil {
        return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
    }

    db := c.Locals("db").(*gorm.DB)
    var user model.User

    if err := db.Where("email = ?", input.Email).First(&user).Error; err != nil {
        return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "User not found"})
    }

    if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(input.Password)); err != nil {
        return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Invalid password"})
    }

    token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
        "id":   user.ID,
        "role": user.Role,
        "exp":  time.Now().Add(time.Hour * 72).Unix(),
    })

    tokenString, err := token.SignedString(jwtSecret)
    if err != nil {
        return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Could not generate token"})
    }

    user.Token = tokenString
    db.Save(&user)

    return c.JSON(fiber.Map{"token": tokenString})
}