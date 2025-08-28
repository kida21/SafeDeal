package events

import "encoding/json"

type CreateEscrowEvent struct {
	BaseEvent
	ID         uint64  `json:"id"`
	BuyerID    uint32  `json:"buyer_id"`
	SellerID   uint32  `json:"seller_id"`
	Amount     float64 `json:"amount"`
	BuyerAddr  string  `json:"buyer_addr"`
	SellerAddr string  `json:"seller_addr"`
}

func (e *CreateEscrowEvent) ToJSON() ([]byte, error) {
	return json.Marshal(e)
}