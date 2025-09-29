package consumer

import (
	"encoding/json"
	"fmt"
	"log"
    "notification_service/internal/model"
	"notification_service/internal/websockets"
	"notification_service/internal/escrow"
	"message_broker/rabbitmq/events"
)
var escrowClient *escrow.EscrowServiceClient
func init() {
    var err error
    escrowClient, err = escrow.NewEscrowServiceClient("escrow-service:50052")
    if err != nil {
        panic("failed to initialize escrow gRPC client: " + err.Error())
    }
}

func (c *Consumer) createNotification(userID uint, title, message, notifType string, metadata []byte) {
	notif := model.Notification{
		UserID:   userID,
		Type:     notifType,
		Title:    title,
		Message:  message,
		Metadata: string(metadata),
	}

	if err := c.DB.Create(&notif).Error; err != nil {
		log.Printf("Failed to save notification: %v", err)
		return
	}

	// Send via WebSocket
	data, _ := json.Marshal(map[string]interface{}{
		"id":         notif.ID,
		"type":       notif.Type,
		"title":      notif.Title,
		"message":    notif.Message,
		"read":       notif.Read,
		"created_at": notif.CreatedAt.Unix(),
	})

	
       websockets.HubInstance.Broadcast(websockets.Message{
          UserID:  userID,
          Content: data,
    })
  }

func (c *Consumer) handleEscrowCreated(body []byte) {
	var event events.CreateEscrowEvent
	if err := json.Unmarshal(body, &event); err != nil {
		log.Printf("Failed to unmarshal CreateEscrowEvent: %v", err)
		return
	}

	// Notify buyer: "You created this escrow"
	c.createNotification(
		uint(event.BuyerID),
		"Escrow Created",
		fmt.Sprintf("You created an escrow for ETB %.2f", event.Amount),
		"escrow.created",
		body,
	)

	// Notify seller: "You've been invited"
	c.createNotification(
		uint(event.SellerID),
		"Escrow Invitation",
		fmt.Sprintf("You've been invited to an escrow for ETB %.2f", event.Amount),
		"escrow.invitation",
		body,
	)
}

func (c *Consumer) handleEscrowFunded(body []byte) {
	var event events.PaymentSuccessEvent
	if err := json.Unmarshal(body, &event); err != nil {
		log.Printf("Failed to unmarshal EscrowFundedEvent: %v", err)
		return
	}
     
	escrow, err := escrowClient.GetEscrow(uint32(event.EscrowID))
	if err != nil {
		log.Printf("Failed to get escrow from escrow-service: %v", err)
		return
	 }

	 c.createNotification(
		uint(escrow.BuyerId),
		"Escrow Funded",
		fmt.Sprintf("You have funded an Escrow #%d with ETB %.2f", event.EscrowID, event.Amount),
		"escrow.funded",
		body,
	)
	// Notify seller
	c.createNotification(
		uint(escrow.SellerId),
		"Escrow Funded",
		fmt.Sprintf("Escrow #%d has been funded with ETB %.2f", event.EscrowID, event.Amount),
		"escrow.funded",
		body,
	)
}

func (c *Consumer) handleEscrowAccepted(body []byte) {
	var event events.EscrowAcceptedEvent
	if err := json.Unmarshal(body, &event); err != nil {
		log.Printf("Failed to unmarshal EscrowAcceptedEvent: %v", err)
		return
	}
    
	
	escrow, err := escrowClient.GetEscrow(uint32(event.EscrowID))
	if err != nil {
		log.Printf("Failed to get escrow from escrow-service: %v", err)
		return
	 }
	
       //notify buyer
	c.createNotification(
		uint(escrow.BuyerId),
		"Escrow Accepted",
		fmt.Sprintf("Seller %d has accepted the escrow You created #%d",event.UserID, event.EscrowID),
		"escrow.accepted",
		body,
)
}

func (c *Consumer) handleEscrowDisputed(body []byte) {
	var event events.EscrowDisputedEvent
	if err := json.Unmarshal(body, &event); err != nil {
		log.Printf("Failed to unmarshal EscrowDisputedEvent: %v", err)
		return
	}

	resp, err := escrowClient.GetEscrow(uint32(event.EscrowID))
	if err != nil {
		log.Printf("Failed to get escrow from escrow-service: %v", err)
		return
	}

	// Extract user IDs
	buyerID := uint(resp.BuyerId)
	sellerID := uint(resp.SellerId)
	disputerID := uint(event.UserID)

	// Message for the disputer
	c.createNotification(
		disputerID,
		"Dispute Raised",
		fmt.Sprintf("You raised a dispute for escrow #%d", event.EscrowID),
		"escrow.disputed",
		body,
	)

	// Message for the other party
	var recipientID uint
	var disputerRole, recipientRole string

	if disputerID == buyerID {
		recipientID = sellerID
		disputerRole = "Buyer"
		recipientRole = "Seller"
	} else {
		recipientID = buyerID
		disputerRole = "Seller"
		recipientRole = "Buyer"
	}

	c.createNotification(
		recipientID,
		"Dispute Received",
		fmt.Sprintf("A dispute has been raised by %s on escrow #%d", disputerRole, event.EscrowID),
		"escrow.disputed",
		body,
	)

	log.Printf("Dispute notifications sent: %d raised with role:%s, %d received with role:%s", disputerID, disputerRole,recipientID,recipientRole)
}

func (c *Consumer) handleTransferSuccess(body []byte) {
	var event events.TransferSuccessEvent
	if err := json.Unmarshal(body, &event); err != nil {
		log.Printf("Failed to unmarshal TransferSuccessEvent: %v", err)
		return
	}
     escrow, err := escrowClient.GetEscrow(uint32(event.EscrowID))
	if err != nil {
		log.Printf("Failed to get escrow from escrow-service: %v", err)
	 }

	// Notify buyer
	c.createNotification(
		uint(escrow.BuyerId),
		"Funds Released",
		fmt.Sprintf("Funds for escrow #%d have been released", event.EscrowID),
		"transfer.success",
		body,
	)

	c.createNotification(
		uint(escrow.SellerId),
		"Funds Released",
		fmt.Sprintf("Funds for escrow #%d will be released within a moment for you", event.EscrowID),
		"transfer.success",
		body,

	)
}