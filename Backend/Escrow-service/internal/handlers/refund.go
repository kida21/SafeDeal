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

// RefundEscrow refunds the escrow amount back to the buyer.
// It mirrors ConfirmReceipt but transfers funds to the buyer instead of the seller.
func RefundEscrow(c fiber.Ctx) error {
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

	// Authorization: Only the buyer can request a refund
	if uint(userID) != escrow.SellerID {
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
			"error": "Only the seller can request a refund",
		})
	}

	// Business rules: only allow refund if still funded and active
	if escrow.Status != "Disputed" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Escrow is not in a refundable state",
		})
	}
	if !escrow.Active {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Escrow must be accepted by seller before it can be refunded",
		})
	}

	// Get buyer's bank details from user-service
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

	// Initiate transfer to buyer (yes, TransferToSeller is used for any payout)
	chapaClient := chapa.NewClient()
	resp, err := chapaClient.TransferToSeller(
		escrow.BuyerID,
		escrow.Amount,
		fmt.Sprintf("refund-escrow-%d", escrow.ID),
		buyerRes.AccountName.Value,
		buyerRes.AccountNumber.Value,
		int(buyerRes.BankCode.Value),
	)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to initiate refund transfer: " + err.Error(),
		})
	}

	// Update escrow status
	escrow.Status = "Refunded"
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
		"message": "Refund initiated. Funds will be returned to the buyer.",
	})
}