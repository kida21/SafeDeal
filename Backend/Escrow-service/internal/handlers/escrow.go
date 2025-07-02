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
    userID := c.Locals("user_id").(uint32)
    if userID != uint32(escrow.BuyerID) && userID != uint32(escrow.SellerID) {
        return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
            "error": "You do not have access to this escrow",
        })
    }

    return c.JSON(fiber.Map{
        "escrow": escrow,
    })
}