package events

import "encoding/json"
import "time"

type EscrowDisputedEvent struct {
	BaseEvent
	EscrowID uint64 `json:"escrow_id"`
	UserID   uint32 `json:"user_id"`
}

func NewEscrowDisputedEvent(escrowID uint64, userID uint32) *EscrowDisputedEvent {
	return &EscrowDisputedEvent{
		BaseEvent: BaseEvent{
			Type:      "escrow.disputed",
			Timestamp: time.Now().Unix(),
		},
		EscrowID: escrowID,
		UserID:   userID,
	}
}

func (e *EscrowDisputedEvent) ToJSON() ([]byte, error) {
	return json.Marshal(e)
}