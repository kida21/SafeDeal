package handlers

import (
    "strconv"
    "user_service/internal/model"
    "user_service/pkg/validator"

    "github.com/gofiber/fiber/v3"
    "gorm.io/gorm"
)

func Profile(c *fiber.Ctx) error {
    userIDStr := c.Get("X-User-ID")
    if userIDStr == "" {
        return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
            "error": "Missing X-User-ID header – request must come through API Gateway",
        })
    }

    userID, err := strconv.ParseUint(userIDStr, 10, 32)
    if err != nil {
        return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
            "error": "Invalid user ID",
        })
    }

    db := c.Locals("db").(*gorm.DB)
    var user model.User

    if err := db.First(&user, uint(userID)).Error; err != nil {
        return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
            "error": "User not found",
        })
    }

    return c.JSON(fiber.Map{
        "id":             user.ID,
        "first_name":     user.FirstName,
        "last_name":      user.LastName,
        "email":          user.Email,
        "activated":      user.Activated,
        "account_number": user.AccountNumber,
        "wallet_address": user.WalletAddress,
    })
}

func UpdateBankDetails(c *fiber.Ctx) error {
    type Request struct {
        AccountName   string `json:"account_name" validate:"required,chars_only,min=2"`
        AccountNumber string `json:"account_number"`
        BankCode      int    `json:"bank_code" validate:"required,min=100,max=999"`
    }

    var req Request
    if err := c.BodyParser(&req); err != nil {
        return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request"})
    }

    if err := validator.ValidateStruct(req); err != nil {
        return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
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
    var user model.User

    if err := db.First(&user, uint(userID)).Error; err != nil {
        return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "User not found"})
    }

    user.AccountName = &req.AccountName
    user.AccountNumber = &req.AccountNumber
    user.BankCode = &req.BankCode

    if err := db.Save(&user).Error; err != nil {
        return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to save bank details"})
    }

    return c.JSON(fiber.Map{
        "message": "Bank details updated successfully",
    })
}
