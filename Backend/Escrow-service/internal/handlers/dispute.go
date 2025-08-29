package handlers

import (
	"escrow_service/internal/model"
	"strconv"

	"github.com/gofiber/fiber/v3"
	"gorm.io/gorm"
)

func DisputeEscrow(c fiber.Ctx) error {
	idParam := c.Params("id")
	escrowID, err := strconv.ParseUint(idParam, 10, 64)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid escrow ID",
		})
	}

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
	var escrow model.Escrow

	
	if err := db.First(&escrow,escrowID).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "Escrow not found",
		})
	}

	
	if uint(userID) != escrow.BuyerID && uint(userID) != escrow.SellerID {
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
			"error": "Only buyer or seller can dispute",
		})
	}

	
	if !escrow.Active {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Escrow is not active,Can't dispute",
		})
	}

	if escrow.Status == model.Released{
		return  c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error":"Escrow is Released,Can't issue a dispute",
		})
	}
	if escrow.Status == "Disputed" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Escrow is already resolved or disputed",
		})
	}

	
	escrow.Status = model.Disputed
	db.Save(&escrow)

    return c.JSON(fiber.Map{
		"message":     "Dispute raised successfully",
		"status":      "Disputed",
		"escrow_id":   escrow.ID,
		
	})
}