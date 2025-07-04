package handlers

import (
	"escrow_service/internal/model"
	"strconv"

	"github.com/gofiber/fiber/v3"
	"gorm.io/gorm"
)

func CreateEscrow(c fiber.Ctx) error {
    escrow := new(model.Escrow)
    if err := c.Bind().Body(escrow); err != nil {
        return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
    }

    userID := c.Locals("user_id").(uint32)
    escrow.BuyerID = uint(userID)
    escrow.Status = model.Pending

    db := c.Locals("db").(*gorm.DB)
    db.Create(&escrow)

    return c.Status(fiber.StatusCreated).JSON(escrow)
}


// internal/handlers/escrow.go
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

    // Safely extract user data from middleware
    userData := c.Locals("user")
    if userData == nil {
        return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
            "error": "User data missing from context",
        })
    }

    userMap, ok := userData.(map[string]interface{})
    if !ok {
        return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
            "error": "Invalid user data format",
        })
    }

    userIDInterface := userMap["user_id"]
    if userIDInterface == nil {
        return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
            "error": "Missing user_id in token",
        })
    }

    userID, ok := userIDInterface.(uint32)
    if !ok {
        return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
            "error": "Invalid user_id type",
        })
    }

    if userID != uint32(escrow.BuyerID) && userID != uint32(escrow.SellerID) {
        return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
            "error": "Access denied to this escrow",
        })
    }

    return c.JSON(escrow)
}