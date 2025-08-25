package handlers

import (
	"fmt"
	"log"
	"os"
	"payment_service/internal/escrow"
	"payment_service/internal/model"
	"payment_service/pkg/chapa"
	"payment_service/pkg/utils"
	"strconv"

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

    if req.EscrowID == 0 {
        return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
            "error": "Escrow ID is required",
        })
    }
    
    if req.Amount <= 0 {
        return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
            "error": "Amount must be greater than zero",
        })
    }
    if req.Currency == "" {
        req.Currency = "ETB" 
    }
    if req.Email == "" {
        return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
            "error": "Email is required",
        })
    }

    if req.FirstName == "" || req.LastName == ""{
        return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
            "error":"either first name or last name is empty",
        })
    }
    
    userIDStr := c.Get("X-User-ID")
    buyerID, _ := strconv.ParseUint(userIDStr, 10, 32)

    escrowClient, _ := escrow.NewEscrowServiceClient("escrow-service:50052")
    
    escrowResp, err := escrowClient.GetEscrow(uint32(req.EscrowID))
    
    if err != nil {
        return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
            "error": "Escrow not found",
        })
    }
   
    if escrowResp.BuyerId != uint32(buyerID) {
        return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
            "error": "You are not authorized to fund this escrow",
        })
    }
    

    var existing model.EscrowPayment
    db := c.Locals("db").(*gorm.DB)
    if err := db.Where("escrow_id = ?", req.EscrowID).First(&existing).Error; err == nil {
        return c.Status(fiber.StatusConflict).JSON(fiber.Map{
            "error": "Payment already initiated for this escrow",
        })
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

   db.Create(&model.EscrowPayment{
        EscrowID:       req.EscrowID,
        BuyerID:         req.BuyerID,
        TransactionRef: txRef,
        Amount:         req.Amount,
        Currency:       req.Currency,
        Status:         model.Pending,
        PaymentURL:     paymentURL,
    })

    return c.JSON(fiber.Map{"payment_url": paymentURL, "tx_ref": txRef})
}

