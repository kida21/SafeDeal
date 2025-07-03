package handlers

import (
	"os"
	"time"
    "user_service/internal/model"
	"user_service/pkg/session"
	"github.com/gofiber/fiber/v3"
	"github.com/golang-jwt/jwt/v5"
	
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

func Login(c fiber.Ctx) error {
    type LoginInput struct {
        Email    string `json:"email"`
        Password string `json:"password"`
    }

    var input LoginInput
    if err := c.Bind().Body(&input); err != nil {
        return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid input"})
    }

    db := c.Locals("db").(*gorm.DB)
    var user model.User

    if err := db.Where("email = ?", input.Email).First(&user).Error; err != nil {
        return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "User not found"})
    }

    if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(input.Password)); err != nil {
        return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Invalid credentials"})
    }
    session.RevokeAllSessionsForUser(user.ID)
    sessionID := session.GenerateSessionID(user.ID)

    // Create new access token
    claims := jwt.RegisteredClaims{
        Issuer:    "user-service",
        Subject:   sessionID,
        ExpiresAt: jwt.NewNumericDate(time.Now().Add(15 * time.Minute)),
        IssuedAt:  jwt.NewNumericDate(time.Now()),
    }
    token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
    signedToken, _ := token.SignedString([]byte(os.Getenv("JWT_SECRET_KEY")))
    return c.JSON(fiber.Map{
        "access_token":  signedToken,
        })
}

func Register(c fiber.Ctx) error {
    type RegisterInput struct {
        Email    string `json:"email"`
		FirstName string `json:"firstname"`
		LastName  string  `json:"lastname"`
        Password string `json:"password"`
    }

    var input RegisterInput
    if err := c.Bind().Body(&input); err != nil {
        return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
            "error": "Invalid input",
        })
    }

    
    var existingUser model.User
    db := c.Locals("db").(*gorm.DB)
    if err := db.Where("email = ?", input.Email).First(&existingUser).Error; err == nil {
        return c.Status(fiber.StatusConflict).JSON(fiber.Map{
            "error": "Email already in use",
        })
    }

   hashedPassword, err := bcrypt.GenerateFromPassword([]byte(input.Password), bcrypt.DefaultCost)
    if err != nil {
        return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
            "error": "Could not hash password",
        })
    }

    
    user := model.User{
        Email:    input.Email,
		FirstName: input.FirstName,
		LastName: input.LastName,
        Password: string(hashedPassword),
        
		
    }

    db.Create(&user)
    return c.Status(fiber.StatusCreated).JSON(fiber.Map{
        "message": "User registered successfully",
        "user": fiber.Map{
            "id":    user.ID,
            "email": user.Email,
        },
    })
}

func Profile(c fiber.Ctx) error {
    token, ok := c.Locals("user").(*jwt.Token)
    if !ok || token == nil {
        return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
            "error": "Invalid or missing token",
        })
    }
    claims, ok := token.Claims.(jwt.MapClaims)
    if !ok || !token.Valid {
        return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
            "error": "Invalid token claims",
        })
    }
    userIDFloat, ok := claims["user_id"].(float64)
    if !ok {
        return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
            "error": "User ID not found in token",
        })
    }
    userID := uint(userIDFloat)
    db := c.Locals("db").(*gorm.DB)
    var userModel model.User

    if err := db.Select("id","first_name","last_name", "email").First(&userModel, userID).Error; err != nil {
        return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
            "error": "User not found",
        })
    }
   return c.JSON(fiber.Map{
        "user": fiber.Map{
            "id":    userModel.ID,
            "firstname":  userModel.FirstName,
            "lastname":userModel.LastName,
            "email": userModel.Email,
        },
    })
}