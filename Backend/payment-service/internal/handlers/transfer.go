package handlers

import (
	"log"
	"payment_service/internal/rabbitmq"
	"strconv"
	"strings"

	"github.com/gofiber/fiber/v3"
)

func HandleTransferWebhook(c fiber.Ctx) error {
	type Payload struct {
		TransferID string `json:"transfer_id"`
		Status     string `json:"status"`
		Reference  string `json:"reference"` // escrow-123
	}

	var payload Payload
	if err := c.Bind().Body(&payload); err != nil {
		return c.Status(fiber.StatusBadRequest).SendString("Invalid payload")
	}

	if payload.Status != "success" {
		return c.SendStatus(fiber.StatusOK)
	}

	
	escrowIDStr := strings.TrimPrefix(payload.Reference, "escrow-")
	escrowID, err := strconv.ParseUint(escrowIDStr, 10, 64)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid reference",
		})
	}

	
	producer := rabbitmq.NewProducer()
	err = producer.PublishTransferSuccess(
		payload.TransferID,
		escrowID,
	)
	if err != nil {
		log.Printf("Failed to publish transfer.success: %v", err)
		
	}

	return c.SendStatus(fiber.StatusOK)
}