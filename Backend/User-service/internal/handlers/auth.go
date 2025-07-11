package handlers

import (
	"context"
	"os"
	"strconv"
	"strings"
	"time"
	"user_service/internal/model"
	"user_service/pkg/refresh"
	"user_service/pkg/session"

	"github.com/gofiber/fiber/v3"
	"github.com/golang-jwt/jwt/v5"
	"github.com/redis/go-redis/v9"

	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

var redisClient *redis.Client

func SetRedisClient(client *redis.Client) {
    redisClient = client
}

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

func RefreshToken(c fiber.Ctx) error {
    type Request struct {
        RefreshToken string `json:"refresh_token"`
    }
    
    var req Request
    if err := c.Bind().Body(&req); err != nil {
        return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request"})
    }

   
    valid, sessionID := refresh.ValidateRefreshToken(req.RefreshToken)
    if !valid {
        return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Invalid refresh token"})
    }

    // Get session info to validate ownership
    ctx := context.Background()
    val, _ := redisClient.Get(ctx, "session:"+sessionID).Result()
    userID, _ := strconv.Atoi(val)

   
    claims := jwt.RegisteredClaims{
        Issuer:    "user-service",
        Subject:   strconv.Itoa(userID),
        ID:        sessionID,
        ExpiresAt: jwt.NewNumericDate(time.Now().Add(15 * time.Minute)),
        IssuedAt:  jwt.NewNumericDate(time.Now()),
    }

    newToken := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
    signedToken, _ := newToken.SignedString([]byte(os.Getenv("JWT_SECRET_KEY")))

    return c.JSON(fiber.Map{
        "access_token": signedToken,
    })
}
func Logout(c fiber.Ctx) error {
    authHeader := c.Get("Authorization")
    if authHeader == "" {
        return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Missing token"})
    }

    parts := strings.Split(authHeader, " ")
    if len(parts) != 2 || parts[0] != "Bearer" {
        return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Invalid token format"})
    }

    tokenStr := parts[1]

    token, err := jwt.Parse(tokenStr, func(t *jwt.Token) (any, error) {
        return []byte(os.Getenv("JWT_SECRET_KEY")), nil
    })

    if err != nil || !token.Valid {
        // Even if expired or invalid, we still want to revoke session
        claims := token.Claims.(jwt.MapClaims)
        sessionID := claims["jti"].(string)
       if sessionID != "" {
            session.RevokeSession(sessionID)
        }

        return c.JSON(fiber.Map{"message": "Already logged out or token invalid"})
    }

    claims := token.Claims.(jwt.MapClaims)
    sessionID := claims["jti"].(string)

    session.RevokeSession(sessionID)

    return c.SendStatus(fiber.StatusOK)
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
        Activated: false,
        Version: 1,
        
		
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
    user := c.Locals("user").(map[string]interface{})
    userID := user["user_id"].(uint)

    db := c.Locals("db").(*gorm.DB)
    var userModel model.User

    if err := db.Select("id", "first_name","last_name", "email").First(&userModel, userID).Error; err != nil {
        return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "User not found"})
    }

    return c.JSON(fiber.Map{"user": fiber.Map{
        "id":userModel.ID,
        "firstname":userModel.FirstName,
        "lastname":userModel.LastName,
        "email":userModel.Email,
    }})
}

