package handlers

import (
    "payment_service/internal/model"
    "payment_service/internal/escrow"
    "payment_service/pkg/chapa"
    "payment_service/pkg/utils"
    "os"
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
        EscrowID uint    `json:"escrow_id"`
        Amount   float64 `json:"amount"`
        Currency string  `json:"currency"`
        Email    string  `json:"email"`
    }

    var req Request
    if err := c.Bind().Body(&req); err != nil {
        return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
            "error": "Invalid request payload",
        })
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
        return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
            "error": "Failed to initiate payment with Chapa",
        })
    }

    db := c.Locals("db").(*gorm.DB)
    if db == nil {
        return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
            "error": "Database connection not available",
        })
    }
    if err := db.Create(&model.EscrowPayment{
        EscrowID:       req.EscrowID,
        TransactionRef: txRef,
        Amount:         req.Amount,
        Currency:       req.Currency,
        Status:         model.Pending,
        PaymentURL:     paymentURL,
    }).Error; err != nil {
        return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
            "error": "Failed to save transaction to database",
        })
    }
    escrowClient.UpdateEscrowStatus(uint32(req.EscrowID), "Funded")

    return c.JSON(fiber.Map{
        "payment_url":     paymentURL,
        "transaction_ref": txRef,
    })
}

// HandleChapaWebhook receives Chapa's webhook after payment completion
func HandleChapaWebhook(c fiber.Ctx) error {
    type ChapaWebhookPayload struct {
        TxRef  string `json:"tx_ref"`
        Status string `json:"status"` // success or failed
    }

    var payload ChapaWebhookPayload
    if err := c.Bind().Body(&payload); err != nil {
        return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
            "error": "Invalid webhook payload",
        })
    }

    db := c.Locals("db").(*gorm.DB)

    var payment model.EscrowPayment
    if err := db.Where("transaction_ref = ?", payload.TxRef).First(&payment).Error; err != nil {
        return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
            "error": "Transaction not found",
        })
    }

    
    newStatus := model.TransactionStatus(payload.Status)
    if newStatus != model.Completed && newStatus != model.Failed {
        newStatus = model.Failed
    }

    if err := db.Model(&payment).Update("status", newStatus).Error; err != nil {
        return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
            "error": "Failed to update transaction status",
        })
    }
    if newStatus == model.Completed {
        escrowClient.UpdateEscrowStatus(uint32(payment.EscrowID), "Funded")
    }

    return c.SendStatus(fiber.StatusOK)
}