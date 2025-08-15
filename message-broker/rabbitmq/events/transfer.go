package events

import "encoding/json"

type TransferSuccessEvent struct {
	BaseEvent
	TransferID string `json:"transfer_id"`
	EscrowID   uint64 `json:"escrow_id"`
}

func (e *TransferSuccessEvent) ToJSON() ([]byte, error) {
	return json.Marshal(e)
}