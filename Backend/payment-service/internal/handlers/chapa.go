package handlers

import (
	"blockchain_adapter"
	"context"
	"log"
	"math/big"
	"payment_service/internal/model"
	"payment_service/internal/rabbitmq"
	redisclient "payment_service/pkg/redis"
	"strings"

	"github.com/ethereum/go-ethereum/accounts/abi/bind/v2"
	"github.com/gofiber/fiber/v3"
	"gorm.io/gorm"
)
var blockchainClient *blockchain.Client

func SetBlockchainClient(client *blockchain.Client) {
	blockchainClient = client
}
func HandleChapaWebhook(c fiber.Ctx) error {
	log.Println("✅ Webhook called by Chapa")
	type Payload struct {
		TxRef  string `json:"tx_ref"`
		Status string `json:"status"`
	}

	var payload Payload
	if err := c.Bind().Body(&payload); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid payload"})
	}

	if redisclient.IsProcessed(payload.TxRef) {
		log.Printf("Duplicate webhook ignored: %s", payload.TxRef)
		return c.SendStatus(fiber.StatusOK)
	}

	db := c.Locals("db").(*gorm.DB)
	var payment model.EscrowPayment

	if err := db.Where("transaction_ref = ?", payload.TxRef).First(&payment).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "Transaction not found"})
	}

	if payload.Status == "success" {
		// Prevent double update
		if payment.Status == model.Completed {
			log.Printf("Payment already completed: %s", payload.TxRef)
		} else {
			payment.Status = model.Completed
			db.Save(&payment)
			

			
			producer := rabbitmq.NewProducer()
			err := producer.PublishPaymentSuccess(
				payload.TxRef,
				uint32(payment.EscrowID),
				uint32(payment.BuyerID),
				payment.Amount,
			)
			if err != nil {
				log.Printf("Failed to publish event: %v", err)
			} else {
				log.Println("Published payment.success event to RabbitMQ")
			}
		}

		
		if blockchainClient == nil {
			log.Println("Blockchain client not initialized")
			// Don't fail webhook
		} else if blockchainClient.Contract == nil {
			log.Println("Blockchain contract not loaded")
		} else {
		
			resp, err := escrowClient.GetEscrow(uint32(payment.EscrowID))
			if err != nil {
				log.Printf("Failed to fetch escrow: %v", err)
			} else {
				id := uint64(resp.BlockchainEscrowId)
				onChainId := new(big.Int).SetUint64(id)

				
				tx, err := blockchainClient.Contract.ConfirmPayment(blockchainClient.Auth, onChainId)
				if err != nil {
					
					if strings.Contains(err.Error(), "execution reverted: Invalid status") {
						log.Printf("Escrow %d already confirmed on-chain", id)
					} else {
						log.Printf("Failed to call confirmPayment for on-chain id %d: %v", id, err)
					}
				} else {
					receipt, err := bind.WaitMined(context.Background(), blockchainClient.Client, tx.Hash())
					if err != nil {
						log.Printf("Transaction mining failed: %v", err)
					} else {
						
						for _, vlog := range receipt.Logs {
							event, err := blockchainClient.Contract.ParsePaymentConfirmed(*vlog)
							if err == nil && event != nil {
								log.Printf("On-chain status updated: Escrow ID %d → ACTIVE", event.Id.Uint64())
								break
							}
						}
					}
				}
			}
		}

		
		redisclient.MarkAsProcessed(payload.TxRef)
	}

	return c.SendStatus(fiber.StatusOK)
}