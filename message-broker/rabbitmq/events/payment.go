package events

import (
	"encoding/json"
	"time"
)

type PaymentSuccessEvent struct {
    BaseEvent
    TransactionRef string  `json:"transaction_ref"`
    EscrowID       uint32  `json:"escrow_id"`
    Amount         float64 `json:"amount"`
    UserID         uint32  `json:"user_id"`
}

func NewPaymentSuccessEvent(txRef string, escrowID, userID uint32, amount float64) *PaymentSuccessEvent {
    return &PaymentSuccessEvent{
        BaseEvent: BaseEvent{
            Type:      "payment.success",
            Timestamp: time.Now().Unix(),
        },
        TransactionRef: txRef,
        EscrowID:       escrowID,
        Amount:         amount,
        UserID:         userID,
    }
}

func (e *PaymentSuccessEvent) ToJSON() ([]byte, error) {
    return json.Marshal(e)
}