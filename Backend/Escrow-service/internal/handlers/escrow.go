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

    userIDStr := c.Get("X-User-ID")
    if userIDStr == "" {
        return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
            "error": "Missing X-User-ID header – request must come through API Gateway",
        })
    }

     buyerID, err := strconv.ParseUint(userIDStr, 10, 32)
    if err != nil {
        return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
            "error": "Invalid user ID format",
        })
    }

   

    escrow.BuyerID = uint(buyerID)
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