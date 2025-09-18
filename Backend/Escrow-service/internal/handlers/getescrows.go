package handlers

import (
	"escrow_service/internal/model"
	"strconv"

	"github.com/gofiber/fiber/v3"
	"gorm.io/gorm"
)

type EscrowSummary struct {
	Total      int `json:"total"`
	Active     int `json:"active"`
	Completed  int `json:"completed"`
}

func GetUserEscrows(c fiber.Ctx) error {
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
	var escrows []model.Escrow

	
	if err := db.Where("buyer_id = ? OR seller_id = ?", userID, userID).
		Order("created_at DESC").
		Find(&escrows).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to fetch escrows",
		})
	}

	
	summary := EscrowSummary{}
	for _, e := range escrows {
		summary.Total++
		if e.Active {
			summary.Active++
		}
		if e.Status == model.Released {
			summary.Completed++
		}
	}


	var results []fiber.Map
	for _, e := range escrows {
		results = append(results, fiber.Map{
			"id":                    e.ID,
			"buyer_id":              e.BuyerID,
			"seller_id":             e.SellerID,
			"amount":                e.Amount,
			"status":                e.Status,
			"conditions":            e.Conditions,
			"blockchain_tx_hash":    e.BlockchainTxHash,
			"blockchain_escrow_id":  e.BlockchainEscrowID,
			"active":                e.Active,
			"created_at":            e.CreatedAt,
		})
	}

	return c.JSON(fiber.Map{
		"escrows": results,
		"summary": summary,
	})
}