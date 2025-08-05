package handlers

import (
	"escrow_service/internal/auth"
	"escrow_service/internal/model"
	"math/big"

	
	"blockchain_adapter"

	"os"
	"shared/crypto"
	"shared/wallet"
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
			"error": "Missing X-User-ID header",
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

	escrow.BuyerID = uint(buyerID)
	escrow.Status = model.Pending

	db := c.Locals("db").(*gorm.DB)
	if err := db.Create(&escrow).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to create escrow",
		})
	}

	
	var buyerAddr, sellerAddr common.Address

	if buyerRes.WalletAddress == "" {
		wallet, err := wallet.GenerateWallet()
		if err != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"error": "Failed to generate buyer wallet",
			})
		}
		buyerAddr = common.HexToAddress(wallet.Address)

		
		exists, err := userServiceClient.CheckWalletAddress(wallet.Address)
		if err != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"error": "Failed to check wallet address",
			})
		}
		if exists {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"error": "Generated wallet address already exists",
			})
		}

		_, err = crypto.Encrypt(wallet.PrivateKey, os.Getenv("ENCRYPTION_KEY"))
		if err != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"error": "Failed to encrypt buyer private key",
			})
		}
		
	} else 
	   {
		buyerAddr = common.HexToAddress(buyerRes.WalletAddress)
	  }

	if sellerRes.WalletAddress == "" {
		wallet, err := wallet.GenerateWallet()
		if err != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"error": "Failed to generate seller wallet",
			})
		}
		sellerAddr = common.HexToAddress(wallet.Address)

		exists, err := userServiceClient.CheckWalletAddress(wallet.Address)
		if err != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"error": "Failed to check wallet address",
			})
		}
		if exists {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"error": "Generated wallet address already exists",
			})
		}

		_, err = crypto.Encrypt(wallet.PrivateKey, os.Getenv("ENCRYPTION_KEY"))
		if err != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"error": "Failed to encrypt seller private key",
			})
		}
	} else {
		sellerAddr = common.HexToAddress(sellerRes.WalletAddress)
	}

	
	amount := new(big.Int).SetUint64(uint64(escrow.Amount * 100))
	tx, err := blockchain.NewClient().CreateEscrow(
		buyerAddr,
		sellerAddr,
		amount,
	)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to create on-chain escrow: " + err.Error(),
		})
	}

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"id":                 escrow.ID,
		"buyer_id":           escrow.BuyerID,
		"seller_id":          escrow.SellerID,
		"amount":             escrow.Amount,
		"status":             escrow.Status,
		"conditions":         escrow.Conditions,
		"blockchain_tx_hash": tx.Hash().Hex(),
		"created_at":         escrow.CreatedAt,
		"updated_at":         escrow.UpdatedAt,
	})
}