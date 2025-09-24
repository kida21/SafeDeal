package handlers

import (
	"fmt"
	"log"
	"os"
	"payment_service/internal/auth"
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
var userServiceClient *auth.UserServiceClient

func init() {
    var err error
    escrowClient, err = escrow.NewEscrowServiceClient("escrow-service:50052")
    if err != nil {
        panic("failed to initialize escrow gRPC client: " + err.Error())
    }
    userServiceClient, err = auth.NewUserServiceClient("user-service:50051")
    if err != nil {
        panic("failed to initialize user gRPC client: " + err.Error())
    }
}
func InitiateEscrowPayment(c fiber.Ctx) error {
    type Request struct {
        EscrowID   uint   `json:"escrow_id"`
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
    
   if req.Phone == ""{
        return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
            "error": "Phone Number is required",
        })
    }
    
    userIDStr := c.Get("X-User-ID")
    buyerID, _ := strconv.ParseUint(userIDStr, 10, 32)

    // escrowClient, _ := escrow.NewEscrowServiceClient("escrow-service:50052")
    
    escrowResp, err := escrowClient.GetEscrow(uint32(req.EscrowID))
    
    if err != nil {
        return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
            "error": "Escrow not found",
        })
    }
    if escrowResp.Amount <= 0 {
		 return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
             "error": "Amount must be greater than zero",
	       })
    }
    if escrowResp.BuyerId != uint32(buyerID) {
        return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
            "error": "You are not authorized to fund this escrow",
        })
    }
    userResp, err := userServiceClient.GetUser(uint32(buyerID))
	if err != nil || !userResp.Activated {
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{"error": "User not found or not activated"})
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
        Amount:           fmt.Sprintf("%.2f", escrowResp.Amount),
        Currency:          "ETB",
        Email:             userResp.Email,
        FirstName:         userResp.FirstName,
        LastName:          userResp.LastName,
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
        BuyerID:         uint(buyerID),
        TransactionRef: txRef,
        Amount:         float64(escrowResp.Amount),
        Currency:       "ETB",
        Status:         model.Pending,
        PaymentURL:     paymentURL,
    })

    return c.JSON(fiber.Map{"payment_url": paymentURL, "tx_ref": txRef})
}

