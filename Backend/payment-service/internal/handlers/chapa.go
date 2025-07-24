package handlers

import (
	"fmt"
	"log"
	"os"
	"payment_service/internal/escrow"
	"payment_service/internal/model"
	"payment_service/internal/rabbitmq"
	"payment_service/pkg/chapa"
	"payment_service/pkg/utils"

	"github.com/gofiber/fiber/v3"
	"gorm.io/gorm"
)

var chapaClient = chapa.NewChapaClient(os.Getenv("CHAPA_SECRET_KEY"))
var escrowClient *escrow.EscrowServiceClient

func init() {
    var err error
    escrowClient, err = escrow.NewEscrowServiceClient("escrow-service:50052")
    if err != nil {
        panic("failed to initialize escrow gRPC client: " + err.Error())
    }
}
func InitiateEscrowPayment(c fiber.Ctx) error {
    type Request struct {
        EscrowID   uint   `json:"escrow_id"`
        BuyerID    uint    `json:"buyer_id"`
        Amount     float64 `json:"amount"`  
        Currency   string `json:"currency"`
        Email      string `json:"email"`      
        FirstName  string `json:"first_name"`   
        LastName   string `json:"last_name"`  
        Phone      string `json:"phone_number"` 
    }

    var req Request
    if err := c.Bind().Body(&req); err != nil {
        return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request"})
    }

    txRef := utils.GenerateTxRef()
    paymentURL, _, err := chapaClient.InitiatePayment(chapa.ChapaRequest{
        Amount:           fmt.Sprintf("%.2f", req.Amount),
        Currency:          req.Currency,
        Email:             req.Email,
        FirstName:         req.FirstName,
        LastName:          req.LastName,
        PhoneNumber:       req.Phone,
        TxRef:             txRef,
        CallbackURL:       "https://webhook.site/077164d6-29cb-40df-ba29-8a00e59a7e60",
        ReturnURL:         "",
        CustomTitle:       "Escrow Payment",
        CustomDescription: "Secure escrow transaction via Chapa",
        HideReceipt:       "true",
    })

    if err != nil {
        log.Println("Chapa Error:", err.Error())
       return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
            "error": "Failed to initiate payment with Chapa",
        })
    }

    db := c.Locals("db").(*gorm.DB)
    db.Create(&model.EscrowPayment{
        EscrowID:       req.EscrowID,
        BuyerID:         req.BuyerID,
        TransactionRef: txRef,
        Amount:         req.Amount,
        Currency:       req.Currency,
        Status:         model.Pending,
        PaymentURL:     paymentURL,
    })
    log.Printf("Generated tx_ref: %s", txRef)
   
    return c.JSON(fiber.Map{"payment_url": paymentURL, "tx_ref": txRef})
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
        // Update payment status
        payment.Status = model.Completed
        db.Save(&payment)
        log.Printf("✅ Payment status updated: %s", payment.TransactionRef)

        // ✅ Publish event to RabbitMQ
        producer := rabbitmq.NewProducer()
        err:= producer.PublishPaymentSuccess(
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