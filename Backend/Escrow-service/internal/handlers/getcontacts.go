package handlers

import (
	
	"strconv"

	"escrow_service/internal/auth"
	"escrow_service/internal/model"

	"github.com/gofiber/fiber/v3"
	"gorm.io/gorm"
)
var userServiceClient *auth.UserServiceClient
func init() {
	 var err error
    userServiceClient, err = auth.NewUserServiceClient("user-service:50051")
    if err != nil {
        panic("failed to initialize user gRPC client: " + err.Error())
    }

}
func GetContacts(c fiber.Ctx) error {
	userIDStr := c.Get("X-User-ID")
	if userIDStr == "" {
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{"error": "Missing X-User-ID"})
	}

	userID, err := strconv.ParseUint(userIDStr, 10, 32)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid user ID"})
	}

	db := c.Locals("db").(*gorm.DB)
	var contacts []model.Contact

	// Fetch contacts from DB
	if err := db.Where("user_id = ?", uint(userID)).
		Order("created_at DESC").
		Find(&contacts).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to load contacts"})
	}

	
	

	// Build response
	var results []fiber.Map
	for _, contact := range contacts {
		resp, err := userServiceClient.GetUser(uint32(contact.TargetID))
		if err != nil || !resp.Activated {
			continue 
		}

		results = append(results, fiber.Map{
			"id":         resp.Id,
			"first_name": resp.FirstName,
			"last_name":  resp.LastName,
			"email": 	  resp.Email,
			"profession": resp.Profession,
			"since":      contact.CreatedAt,
			"escrow_id":  contact.EscrowID,
		})
	}

	return c.JSON(fiber.Map{
		"contacts": results,
		"total":    len(results),
	})
}