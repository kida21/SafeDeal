package handlers

import (
	"blockchain_adapter"
	"context"
	"log"
	"math/big"
	"payment_service/internal/model"
	"payment_service/internal/rabbitmq"

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

	db := c.Locals("db").(*gorm.DB)
	var payment model.EscrowPayment

	if err := db.Where("transaction_ref = ?", payload.TxRef).First(&payment).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "Transaction not found"})
	}

	if payload.Status == "success" {
		
		payment.Status = model.Completed
		db.Save(&payment)
		log.Printf("✅ Payment status updated: %s", payment.TransactionRef)

		
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

		
		 if blockchainClient == nil {
	         return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
		       "error": "Blockchain client not initialized",
	         })
       }

		if blockchainClient.Contract == nil {
			log.Println("Blockchain contract not loaded")
			return c.SendStatus(fiber.StatusOK)
		}
        resp,err:= escrowClient.GetEscrow(uint32(payment.EscrowID))
		if err!=nil{
			log.Printf("error on fetching escrow: %v",err)
		}
		id:=uint64(resp.BlockchainEscrowId)
		onChainId:=new(big.Int).SetUint64(id)
		
      tx, err := blockchainClient.Contract.ConfirmPayment(blockchainClient.Auth,onChainId )
		if err != nil {
			log.Printf("Failed to call confirmPayment on-chain: %v", err)
			return c.SendStatus(fiber.StatusOK) 
		}

		
		receipt, err := bind.WaitMined(context.Background(), blockchainClient.Client, tx.Hash())
		if err != nil {
			log.Printf("Transaction mining failed: %v", err)
			return c.SendStatus(fiber.StatusOK)
		}

		// Parse event
		for _, vlog := range receipt.Logs {
			event, err := blockchainClient.Contract.ParsePaymentConfirmed(*vlog)
			if err == nil && event != nil {
				log.Printf("✅ On-chain status updated: Escrow ID %d → ACTIVE", event.Id.Uint64())
				break
			}
		}
	}

	return c.SendStatus(fiber.StatusOK)
}