package handlers

import (
    "github.com/gofiber/fiber/v3"
    "escrow_service/internal/model"
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
    var escrow model.Escrow
    db := c.Locals("db").(*gorm.DB)

    if err := db.First(&escrow, id).Error; err != nil {
        return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "Escrow not found"})
    }

    return c.JSON(escrow)
}