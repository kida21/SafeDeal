package events

import (
	"encoding/json"
	"time"
)

type EscrowFundedEvent struct {
    BaseEvent
    EscrowID uint32  `json:"escrow_id"`
    Amount   float64 `json:"amount"`
    BuyerID  uint32  `json:"buyer_id"`
    SellerID uint32  `json:"seller_id"`
}

func NewEscrowFundedEvent(escrowID, buyerID, sellerID uint32, amount float64) *EscrowFundedEvent {
    return &EscrowFundedEvent{
        BaseEvent: BaseEvent{
            Type:      "escrow.funded",
            Timestamp: time.Now().Unix(),
        },
        EscrowID: escrowID,
        Amount:   amount,
        BuyerID:  buyerID,
        SellerID: sellerID,
    }
}

func (e *EscrowFundedEvent) ToJSON() ([]byte, error) {
    return json.Marshal(e)
}