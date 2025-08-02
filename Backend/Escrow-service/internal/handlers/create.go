package handlers

import (
	"escrow_service/internal/auth"
	"escrow_service/internal/model"
	"strconv"

	"github.com/gofiber/fiber/v3"
	"gorm.io/gorm"
)

func CreateEscrow(c fiber.Ctx) error {
	escrow := new(model.Escrow)
	if err := c.Bind().Body(escrow); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request"})
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

	if escrow.SellerID == 0 {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Seller ID is required",
		})
	}

	if uint32(buyerID) == uint32(escrow.SellerID) {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Buyer and seller cannot be the same user",
		})
	}

	userServiceClient, err := auth.NewUserServiceClient("user-service:50051")
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to connect to user service",
		})
	}
	defer userServiceClient.Close()

	buyer, err := userServiceClient.GetUser(uint32(buyerID))
	if err != nil || !buyer.Activated {
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
			"error": "Buyer account is not activated",
		})
	}

	seller, err := userServiceClient.GetUser(uint32(escrow.SellerID))
	if err != nil || !seller.Activated {
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
			"error": "Seller account is not activated",
		})
	}

	escrow.BuyerID = uint(buyerID)
	escrow.Status = model.Pending

	db := c.Locals("db").(*gorm.DB)
	db.Create(&escrow)

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"id":         escrow.ID,
		"buyer_id":   escrow.BuyerID,
		"seller_id":  escrow.SellerID,
		"amount":     escrow.Amount,
		"status":     escrow.Status,
		"conditions": escrow.Conditions,
		"created_at": escrow.CreatedAt,
		"updated_at": escrow.UpdatedAt,
	})
}