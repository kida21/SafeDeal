package handlers

import (
	"log"
	"payment_service/internal/rabbitmq"
	"strconv"
	"strings"

	"github.com/gofiber/fiber/v3"
)

func HandleTransferWebhook(c fiber.Ctx) error {
	c.Set("ngrok-skip-browser-warning", "1")
	log.Print("TransferWebhook called")
   type Payload struct {
		Status  string `json:"status"`
		Message string `json:"message"`
		Data    string `json:"data"` // This is the reference (e.g., "escrow-2")
	}

	var payload Payload
	if err := c.Bind().Body(&payload); err != nil {
		log.Printf("Invalid JSON: %v", err)
		return c.Status(fiber.StatusBadRequest).SendString("Invalid payload")
	}

	log.Printf("📥 Transfer webhook: %+v", payload)

	if payload.Status != "success" {
		return c.SendStatus(fiber.StatusOK)
	}

	
	escrowIDStr := strings.TrimPrefix(payload.Data, "escrow-")
	escrowID, err := strconv.ParseUint(escrowIDStr, 10, 64)
	if err != nil {
		log.Printf("Invalid reference: %s", payload.Data)
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid reference",
		})
	}
	resp,err:= escrowClient.GetEscrow(uint32(escrowID))
		if err!=nil{
			log.Printf("error on fetching escrow: %v",err)
		}
       if resp.BlockchainEscrowId == 0 {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Escrow not linked to blockchain",
		})
	    }
	id:=uint64(resp.BlockchainEscrowId)
	producer := rabbitmq.NewProducer()
	err = producer.PublishTransferSuccess(payload.Data, escrowID,&id)
	if err != nil {
		log.Printf("Failed to publish transfer.success: %v", err)
		
	} else {
		log.Printf("Published transfer.success for escrow ID: %d", escrowID)
	}

	return c.SendStatus(fiber.StatusOK)
}