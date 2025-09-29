package events

import "encoding/json"
import "time"

type EscrowAcceptedEvent struct {
	BaseEvent
	EscrowID uint64 `json:"escrow_id"`
	UserID   uint32 `json:"user_id"`
}

func NewEscrowAcceptedEvent(escrowID uint64, userID uint32) *EscrowAcceptedEvent {
	return &EscrowAcceptedEvent{
		BaseEvent: BaseEvent{
			Type:      "escrow.accepted",
			Timestamp: time.Now().Unix(),
		},
		EscrowID: escrowID,
		UserID:   userID,
	}
}

func (e *EscrowAcceptedEvent) ToJSON() ([]byte, error) {
	return json.Marshal(e)
}