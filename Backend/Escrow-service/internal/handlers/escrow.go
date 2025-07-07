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

    user := c.Locals("user")
    if user == nil {
        return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
            "error": "User data not found in context",
        })
    }

    userMap, ok := user.(map[string]interface{})
    if !ok {
        return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
            "error": "Invalid user data format",
        })
    }

    userIDInterface := userMap["user_id"]
    userID, ok := userIDInterface.(uint32)
    if !ok {
        return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
            "error": "Invalid or missing user ID",
        })
    }

    escrow.BuyerID = uint(userID)
    escrow.Status = model.Pending

    db := c.Locals("db").(*gorm.DB)
    db.Create(&escrow)

    return c.Status(fiber.StatusCreated).JSON(fiber.Map{
        "id": escrow.ID,
        "buyer_id": escrow.BuyerID,
        "seller_id": escrow.SellerID,
        "amount": escrow.Amount,
        "status": escrow.Status,
        "conditions": escrow.Conditions,
        "created_at": escrow.CreatedAt,
        "updated_at": escrow.UpdatedAt,
    })
}

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

    //extract user data from middleware
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