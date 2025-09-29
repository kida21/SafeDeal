package handlers

import (
	"strconv"

	"payment_service/internal/model"

	"github.com/gofiber/fiber/v3"
	"gorm.io/gorm"
)

func GetTransactionHistory(c fiber.Ctx) error {
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

	db := c.Locals("db").(*gorm.DB)
	var transactions []model.EscrowPayment

	
	if err := db.Where("buyer_id = ? AND status = ?", uint(userID), model.Completed).
		Order("created_at DESC").
		Find(&transactions).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{
			"error": "Failed to fetch transaction history",
		})
	}

	// Build response
	var results []fiber.Map
	for _, tx := range transactions {
		results = append(results, fiber.Map{
			"escrow_id":       tx.EscrowID,
			"transaction_ref": tx.TransactionRef,
			"amount":          tx.Amount,
			"currency":        tx.Currency,
			"status":          tx.Status,
			"created_at":      tx.CreatedAt,
		})
	}

	return c.JSON(fiber.Map{
		"transactions": results,
		"total":        len(results),
		"status":       "success",
	})
}