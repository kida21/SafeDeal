// internal/handlers/chapa.go
package handlers

import (
	"payment_service/internal/model"
	"payment_service/pkg/chapa"
	"payment_service/pkg/utils"
	"os"
	"github.com/gofiber/fiber/v3"
	"gorm.io/gorm"
)

var chapaClient = chapa.NewChapaClient(os.Getenv("CHAPA_SECRET_KEY"))

func InitiateEscrowPayment(c fiber.Ctx) error {
    type Request struct {
        EscrowID uint   `json:"escrow_id"`
        Amount   float64 `json:"amount"`
        Currency string  `json:"currency"`
        Email    string  `json:"email"`
    }

    var req Request
    if err := c.Bind().Body(&req); err != nil {
        return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request"})
    }

    txRef := utils.GenerateTxRef()
    paymentURL, _, err := chapaClient.InitiatePayment(chapa.ChapaRequest{
        Amount:      req.Amount,
        Currency:    req.Currency,
        Email:       req.Email,
        FirstName:   "User",
        LastName:    "",
        CallbackURL: "http://payment-service:8083/webhooks/chapa",
        ReturnURL:   "http://frontend.com/payment/success",
        TxRef:       txRef,
    })

    if err != nil {
        return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Payment init failed"})
    }

    db := c.Locals("db").(*gorm.DB)
    db.Create(&model.EscrowPayment{
        EscrowID:       req.EscrowID,
        TransactionRef: txRef,
        Amount:         req.Amount,
        Currency:       req.Currency,
        Status:         model.Pending,
        PaymentURL:     paymentURL,
    })

    return c.JSON(fiber.Map{
        "payment_url":     paymentURL,
        "transaction_ref": txRef,
    })
}