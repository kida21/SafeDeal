package handlers

import (
	"escrow_service/internal/model"
	"strconv"

	"github.com/gofiber/fiber/v3"
	"gorm.io/gorm"
)

func GetEscrow(c fiber.Ctx) error {
	id := c.Params("id")
	escrowID, err := strconv.ParseUint(id, 10, 32)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid escrow ID",
		})
	}

	db := c.Locals("db").(*gorm.DB)
	var escrow model.Escrow
	if err := db.First(&escrow, uint(escrowID)).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "Escrow not found",
		})
	}

	userIDStr := c.Get("X-User-ID")
	if userIDStr == "" {
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
			"error": "Missing X-User-ID header – request must come through API Gateway",
		})
	}

	userID, err := strconv.ParseUint(userIDStr, 10, 32)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid user ID format",
		})
	}

	if uint32(escrow.BuyerID) != uint32(userID) && uint32(escrow.SellerID) != uint32(userID) {
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
			"error": "Access denied to this escrow",
		})
	}

	return c.JSON(escrow)
}