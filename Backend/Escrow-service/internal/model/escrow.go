// internal/models/escrow.go
package model

import "gorm.io/gorm"

type EscrowStatus string

const (
    Pending   EscrowStatus = "Pending"
    Funded    EscrowStatus = "Funded"
    Released  EscrowStatus = "Released"
    Disputed  EscrowStatus = "Disputed"
)

type Escrow struct {
    gorm.Model
	BuyerID    uint           `gorm:"column:buyer_id;not null" json:"buyer_id"`
    SellerID   uint           `gorm:"column:seller_id;not null" json:"seller_id"`
    Amount     float64        `gorm:"column:amount;not null" json:"amount"`
    Status     EscrowStatus   `gorm:"column:status;not null" json:"status"`
    Conditions string         `gorm:"column:conditions" json:"conditions,omitempty"`
    BlockchainTxHash      *string   `gorm:"type:varchar(66);uniqueIndex" json:"blockchain_tx_hash"` 
	BlockchainEscrowID    *uint64   `gorm:"uniqueIndex" json:"blockchain_escrow_id"`                
}