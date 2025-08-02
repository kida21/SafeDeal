package handlers

import (
	"log"
	"payment_service/internal/model"
	"payment_service/internal/rabbitmq"

	"github.com/gofiber/fiber/v3"
	"gorm.io/gorm"
)

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
		// Update payment status
		payment.Status = model.Completed
		db.Save(&payment)
		log.Printf("✅ Payment status updated: %s", payment.TransactionRef)

		// ✅ Publish event to RabbitMQ
		producer := rabbitmq.NewProducer()
		err := producer.PublishPaymentSuccess(
			payload.TxRef,
			uint32(payment.EscrowID),
			uint32(payment.BuyerID),
			payment.Amount,
		)
		if err != nil {
			log.Printf("❌ Failed to publish event: %v", err)
		} else {
			log.Println("✅ Published payment.success event to RabbitMQ")
		}
	}

	return c.SendStatus(fiber.StatusOK)
}