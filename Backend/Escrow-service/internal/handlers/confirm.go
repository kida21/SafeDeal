package handlers

import (
	"escrow_service/internal/auth"
	"escrow_service/internal/model"
	"fmt"

	//"fmt"
	"shared/chapa"
	"strconv"

	"github.com/gofiber/fiber/v3"
	"gorm.io/gorm"
)

func ConfirmReceipt(c fiber.Ctx) error {
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

	if err := db.First(&escrow, escrowID).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "Escrow not found",
		})
	}

    if uint(userID) != escrow.BuyerID {
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
			"error": "Only the buyer can confirm receipt",
		})
	}

	
	if escrow.Status != "Funded"{
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Escrow is not in a state to be confirmed",
		})
	}
	userServiceClient, err := auth.NewUserServiceClient("user-service:50051")
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to connect to user service"+ err.Error(),
		})
	}
	defer userServiceClient.Close()

	sellerRes, err := userServiceClient.GetUser(uint32(escrow.SellerID))
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to get seller info",
		})
	}
   chapaClient := chapa.NewClient()
	resp, err := chapaClient.TransferToSeller(
		escrow.SellerID,
		escrow.Amount,
		fmt.Sprintf("escrow-%d", escrow.ID),
		sellerRes.Email,
	)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to initiate transfer: " + err.Error(),
		})
	}

    escrow.Status = "TransferPending"
	db.Save(&escrow)

	return c.JSON(fiber.Map{
		"message": "Receipt confirmed. Funds will be released after transfer confirmation.",
		"transfer_id": resp.Data.TransferID,
	})
}
