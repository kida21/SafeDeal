package handlers

import (
	"escrow_service/internal/auth"
	"escrow_service/internal/model"
	"fmt"
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
	if !sellerRes.Activated{
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
		   "error": "Seller account is not activated",
	     })
	}
	if sellerRes.AccountName == nil || sellerRes.AccountName.Value == "" ||
	    sellerRes.AccountNumber == nil || sellerRes.AccountNumber.Value == "" ||
	      sellerRes.BankCode == nil || sellerRes.BankCode.Value == 0 {
	           return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
		          "error": "Seller has not added bank account details",
	           })
            }

	err = chapa.ValidateAccount(int(sellerRes.BankCode.GetValue()), sellerRes.AccountNumber.GetValue())
      if err != nil {
	   return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
		     "error": "Invalid bank details: " + err.Error(),
	      })
        }

    chapaClient := chapa.NewClient()
	resp, err := chapaClient.TransferToSeller(
		escrow.SellerID,
	     escrow.Amount,
	    fmt.Sprintf("escrow-%d", escrow.ID),
		sellerRes.AccountName.Value,
		sellerRes.AccountNumber.Value,
		int(sellerRes.BankCode.Value),
	
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
		"data": resp.Data,
	})
}
