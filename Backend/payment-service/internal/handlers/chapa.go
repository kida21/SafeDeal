package handlers

import (
	"fmt"
	"log"
	"os"
	"payment_service/internal/escrow"
	"payment_service/internal/model"
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
        TransactionRef: txRef,
        Amount:         req.Amount,
        Currency:       req.Currency,
        Status:         model.Pending,
        PaymentURL:     paymentURL,
    })

    return c.JSON(fiber.Map{"payment_url": paymentURL, "tx_ref": txRef})
}

// receives Chapa's webhook after payment completion
func HandleChapaWebhook(c fiber.Ctx) error {
    
    // log.Println("Received webhook:", string(c.Request().Body()))
    type ChapaWebhookPayload struct {
        TxRef  string `json:"tx_ref"`
        Status string `json:"status"` 
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
        err:=escrowClient.UpdateEscrowStatus(uint32(payment.EscrowID), "Funded")
        if err != nil {
            return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
                "error": "Failed to update escrow status",
            })
        }
    }

    return c.SendStatus(fiber.StatusOK)
}