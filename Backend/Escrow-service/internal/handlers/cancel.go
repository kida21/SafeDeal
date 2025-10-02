// escrow_service/handlers/refund_escrow.go

package handlers

import (
	"escrow_service/internal/auth"
	"escrow_service/internal/model"
	"escrow_service/internal/payment"
	"fmt"
	"log"
	"shared/chapa"
	"strconv"

	"github.com/gofiber/fiber/v3"
	"gorm.io/gorm"
)

// CancelEscrow allows the buyer to cancel the escrow if the seller hasn't accepted it yet.
// Funds are refunded to the buyer.
func CancelEscrow(c fiber.Ctx) error {
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

	// Authorization: Only the buyer can cancel
	if uint(userID) != escrow.BuyerID {
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
			"error": "Only the buyer can cancel this escrow",
		})
	}

	// Business rule: Can only cancel if seller has NOT accepted (not active) AND status is Funded
	if escrow.Status != "Funded" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Escrow must be funded to be cancelled",
		})
	}
	if escrow.Active {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Cannot cancel escrow: already accepted by seller",
		})
	}

	// Get buyer's bank details (to refund to them)
	userServiceClient, err := auth.NewUserServiceClient("user-service:50051")
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to connect to user service" + err.Error(),
		})
	}
	defer userServiceClient.Close()

	buyerRes, err := userServiceClient.GetUser(uint32(escrow.BuyerID))
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to get buyer info",
		})
	}

	if !buyerRes.Activated {
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
			"error": "Buyer account is not activated",
		})
	}

	if buyerRes.AccountName == nil || buyerRes.AccountName.Value == "" ||
		buyerRes.AccountNumber == nil || buyerRes.AccountNumber.Value == "" ||
		buyerRes.BankCode == nil || buyerRes.BankCode.Value == 0 {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Buyer has not added bank account details",
		})
	}

	// Validate bank account using Chapa
	err = chapa.ValidateAccount(int(buyerRes.BankCode.GetValue()), buyerRes.AccountNumber.GetValue())
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid bank details: " + err.Error(),
		})
	}

	// Initiate transfer to buyer
	chapaClient := chapa.NewClient()
	resp, err := chapaClient.TransferToSeller(
		escrow.BuyerID,
		escrow.Amount,
		fmt.Sprintf("cancel-escrow-%d", escrow.ID),
		buyerRes.AccountName.Value,
		buyerRes.AccountNumber.Value,
		int(buyerRes.BankCode.Value),
	)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to initiate cancellation refund: " + err.Error(),
		})
	}

	// ✅ Update status to "Cancelled"
	escrow.Status = "Cancelled"
	db.Save(&escrow)

	// Finalize via payment service
	paymentClient, err := payment.NewPaymentServiceClient("payment-service:50053")
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to connect to payment service",
		})
	}
	response, err := paymentClient.Finalize(resp.Data)
	if err != nil {
		log.Printf("gRPC Finalize error: %v ", err)
	}
	if response != nil && !response.Success {
		log.Printf("Finalize failed: %s", response.Error)
	}

	return c.JSON(fiber.Map{
		"message": "Escrow cancelled. Funds have been refunded to the buyer.",
	})
}