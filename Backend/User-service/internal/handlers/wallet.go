package handlers

import (
	"os"
	"shared/crypto"
	"shared/wallet"
	"strconv"
	"strings"
	"user_service/internal/model"

	"github.com/gofiber/fiber/v3"
	"gorm.io/gorm"
)

func CreateWallet(c fiber.Ctx) error {
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

	if err := db.First(&user, userID).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "User not found",
		})
	}

	
	if !user.Activated {
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
			"error": "Account not activated",
		})
	}

	if user.WalletAddress != nil && *user.WalletAddress != "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Wallet already exists",
		})
	}

	
	wallet, err := wallet.GenerateWallet()
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to generate wallet",
		})
	}

	
	encryptedKey, err := crypto.Encrypt(wallet.PrivateKey, os.Getenv("ENCRYPTION_KEY"))
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to encrypt private key",
		})
	}

	
	user.WalletAddress = &wallet.Address
	user.EncryptedPrivateKey = &encryptedKey

	if err := db.Save(&user).Error; err != nil {
		if strings.Contains(err.Error(), "uni_users_wallet_address") {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"error": "Wallet address already taken",
			})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to save wallet",
		})
	}

	return c.JSON(fiber.Map{
		"message":     "Wallet created successfully",
		"wallet_address": wallet.Address,
		
	})
}