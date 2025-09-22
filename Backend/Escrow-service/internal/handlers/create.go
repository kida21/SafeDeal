package handlers

import (
	
	"escrow_service/internal/auth"
	"escrow_service/internal/model"
	"escrow_service/internal/rabbitmq"
	"log"
	"strconv"

	"github.com/ethereum/go-ethereum/common"
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
			"error": "Missing X-User-ID",
		})
	}

	buyerID, err := strconv.ParseUint(userIDStr, 10, 32)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid user ID",
		})
	}

	if escrow.SellerID == 0 {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Seller ID is required",
		})
	}
    if escrow.Amount <= 0 {
		 return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
             "error": "Amount must be greater than zero",
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

	buyerRes, err := userServiceClient.GetUser(uint32(buyerID))
	if err != nil || buyerRes == nil || !buyerRes.Activated {
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
			"error": "Buyer account is not activated",
		})
	}

	sellerRes, err := userServiceClient.GetUser(uint32(escrow.SellerID))
	if err != nil || sellerRes == nil || !sellerRes.Activated {
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
			"error": "Seller account is not activated",
		})
	}

	// ✅ Validate bank details
	if buyerRes.AccountName == nil || buyerRes.AccountName.Value == "" ||
		buyerRes.AccountNumber == nil || buyerRes.AccountNumber.Value == "" ||
		buyerRes.BankCode == nil || buyerRes.BankCode.Value == 0 {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Buyer has not added bank account details",
		})
	}
	if sellerRes.AccountName == nil || sellerRes.AccountName.Value == "" ||
		sellerRes.AccountNumber == nil || sellerRes.AccountNumber.Value == "" ||
		sellerRes.BankCode == nil || sellerRes.BankCode.Value == 0 {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Seller has not added bank account details",
		})
	}

	// ✅ Validate wallet
	var buyerAddr, sellerAddr common.Address
	if buyerRes.WalletAddress == nil || buyerRes.WalletAddress.Value == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Buyer has not created a wallet",
		})
	}
	buyerAddr = common.HexToAddress(buyerRes.WalletAddress.Value)

	if sellerRes.WalletAddress == nil || sellerRes.WalletAddress.Value == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Seller has not created a wallet",
		})
	}
	sellerAddr = common.HexToAddress(sellerRes.WalletAddress.Value)

	// ✅ Set escrow fields
	escrow.BuyerID = uint(buyerID)
	escrow.Status = model.Pending

	

	// ✅ Save in DB
	db := c.Locals("db").(*gorm.DB)
	if err := db.Create(&escrow).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to create escrow",
		})
	}

	// ✅ Publish event
	producer := rabbitmq.NewProducer()
	err = producer.PublishCreateEscrow(
		uint64(escrow.ID),
		uint32(escrow.BuyerID),
		uint32(escrow.SellerID),
		escrow.Amount,
		buyerAddr.Hex(),
		sellerAddr.Hex(),
	)
	if err != nil {
		log.Printf("Failed to publish CreateEscrow event: %v", err)
		// Don't fail — best effort
	}

	return c.Status(fiber.StatusAccepted).JSON(fiber.Map{
		"message": "Escrow creation started",
		"id":      escrow.ID,
		"status":  "Pending",
		"on_chain_status": "awaiting_confirmation",
	})
}