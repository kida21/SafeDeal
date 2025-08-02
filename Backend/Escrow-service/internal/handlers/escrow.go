package handlers

import (
	"escrow_service/internal/model"
	"strconv"

	"github.com/gofiber/fiber/v3"
	"gorm.io/gorm"
)

func ReleaseEscrow(c fiber.Ctx) error {
    id := c.Params("id")
    escrowID, _ := strconv.ParseUint(id, 10, 32)

    db := c.Locals("db").(*gorm.DB)
    var escrow model.Escrow

    if err := db.First(&escrow, uint(escrowID)).Error; err != nil {
        return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "Escrow not found"})
    }

    user := c.Locals("user").(map[string]interface{})
    userID := user["user_id"].(uint32)

    
    if userID != uint32(escrow.SellerID) {
        return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
            "error": "Only the seller can request release",
        })
    }
    escrow.Status = model.Released
    db.Save(&escrow)

    return c.JSON(fiber.Map{"message": "Release requested", "escrow": escrow})
}