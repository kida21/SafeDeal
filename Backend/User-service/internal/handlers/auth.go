package handlers

import (
	"context"
	"fmt"
	"os"
	"strconv"
	"strings"
	"time"
	"user_service/internal/model"
	"user_service/pkg/mailer"
	"user_service/pkg/refresh"
	"user_service/pkg/session"
	Token "user_service/pkg/token"
	"user_service/pkg/validator"

	"github.com/gofiber/fiber/v3"
	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
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

func RefreshToken(c fiber.Ctx) error {
    type Request struct {
        RefreshToken string `json:"refresh_token"`
    }

    var req Request
    if err := c.Bind().Body(&req); err != nil {
        return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
            "error": "Invalid request payload",
        })
    }

    if req.RefreshToken == "" {
        return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
            "error": "Missing refresh token",
        })
    }

    
    valid, oldSessionID := refresh.ValidateRefreshToken(req.RefreshToken)
    if !valid {
        return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
            "error": "Invalid or expired refresh token",
        })
    }

    
    ctx := context.Background()
    val, err := redisClient.Get(ctx, "session:"+oldSessionID).Result()
    if err != nil {
        return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
            "error": "Session not found",
        })
    }

    userID, err := strconv.Atoi(val)
    if err != nil {
        return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
            "error": "Invalid session data",
        })
    }

    
    session.RevokeSession(oldSessionID)

    
    newSessionID := uuid.New().String()
    newSessionKey := "session:" + newSessionID
    err = redisClient.Set(ctx, newSessionKey, userID, 72*time.Hour).Err()
    if err != nil {
        return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
            "error": "Failed to create new session",
        })
    }

    
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

    
    newRefreshToken:= refresh.GenerateRefreshToken(newSessionID)
    if newRefreshToken == "" {
        return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
            "error": "Failed to generate refresh token",
        })
    }

    refresh.RevokeRefreshToken(req.RefreshToken)

    
    return c.JSON(fiber.Map{
        "access_token":  signedToken,
        "refresh_token": newRefreshToken,
        "expires_in":    900,
    })
}

func Logout(c fiber.Ctx) error {
    
    authHeader := c.Get("Authorization")
    if authHeader == "" {
        return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
            "error": "Missing authorization header",
        })
    }

    tokenString := strings.TrimPrefix(authHeader, "Bearer ")
    if tokenString == authHeader {
        return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
            "error": "Invalid token format",
        })
    }

    
    token, err := jwt.ParseWithClaims(tokenString, &CustomClaims{}, func(token *jwt.Token) (interface{}, error) {
        if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
            return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
        }
        return []byte(os.Getenv("JWT_SECRET_KEY")), nil
    })

    if err != nil || !token.Valid {
        return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
            "error": "Invalid or expired token",
        })
    }

    claims, ok := token.Claims.(*CustomClaims)
    if !ok {
        return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
            "error": "Invalid token claims",
        })
    }

    
    err = session.RevokeSession(claims.ID) 
    if err != nil {
        return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
            "error": "Failed to revoke session",
        })
    }

    return c.JSON(fiber.Map{
        "message": "Logged out successfully",
    })
}

func Register(c fiber.Ctx) error {
    type RegisterRequest struct {
        FirstName string `json:"first_name" validate:"required,chars_only,min=2,max=50"`
        LastName  string `json:"last_name" validate:"required,chars_only,min=2,max=50"`
        Email     string `json:"email" validate:"required,email"`
        Password  string `json:"password" validate:"required,min=8"`
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
        Email:    req.Email,
		FirstName: req.FirstName,
		LastName: req.LastName,
        Password: string(hashedPassword),
        Activated: false,
        Version: 1,
        
		
    }

    db.Create(&user)
    token:=Token.GenerateActivationToken(req.Email)
    mailer := mailer.NewMailer()
    go func() {
        err := mailer.SendActivationEmail(user.Email, token)
        if err != nil {
            fmt.Println("Failed to send activation email:", err)
        }
    }()

    return c.Status(fiber.StatusCreated).JSON(fiber.Map{
        "message": "Registration successful. Please check your email to activate your account.",
        "user": fiber.Map{
            "first_name": user.FirstName,
            "last_name":  user.LastName,
            "email":      user.Email,
            "activated":  user.Activated,
        },
    })
}

func Profile(c fiber.Ctx) error {
    userIDStr := c.Get("X-User-ID")
    if userIDStr == "" {
        return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
            "error": "Missing X-User-ID header – request must come through API Gateway",
        })
    }

    userID, err := strconv.ParseUint(userIDStr, 10, 32)
    if err != nil {
        return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
            "error": "Invalid user ID",
        })
    }

    db := c.Locals("db").(*gorm.DB)
    var user model.User

    if err := db.First(&user, uint(userID)).Error; err != nil {
        return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
            "error": "User not found",
        })
    }

    return c.JSON(fiber.Map{
        "id":         user.ID,
        "first_name": user.FirstName,
        "last_name":  user.LastName,
        "email":      user.Email,
        "activated":  user.Activated,
    })
}

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
