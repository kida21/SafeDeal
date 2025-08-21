package handlers

import (
	"escrow_service/internal/model"
	"strconv"

	"github.com/gofiber/fiber/v3"
	"gorm.io/gorm"
)

func AcceptEscrow(c fiber.Ctx) error {
	idParam := c.Params("id")
	escrowID, err := strconv.ParseUint(idParam, 10, 64)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid escrow ID"})
	}

	userIDStr := c.Get("X-User-ID")
	if userIDStr == "" {
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{"error": "Missing X-User-ID"})
	}
	userID, err := strconv.ParseUint(userIDStr, 10, 32)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid user ID"})
	}

	db := c.Locals("db").(*gorm.DB)
	var escrow model.Escrow

	if err := db.First(&escrow, "id = ?", escrowID).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "Escrow not found"})
	}

	if uint(userID) != escrow.SellerID {
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{"error": "Only seller can accept"})
	}

	if escrow.Status != "Funded" && escrow.Status != "ACTIVE" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Escrow not funded"})
	}

	escrow.Active = true
	db.Save(&escrow)

	return c.JSON(fiber.Map{
		"message": "Escrow accepted. Chat is now enabled.",
		"active":  true,
	})
}