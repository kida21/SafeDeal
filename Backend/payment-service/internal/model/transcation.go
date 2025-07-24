package model

import "gorm.io/gorm"

type TransactionStatus string

const (
    Pending     TransactionStatus = "Pending"
    Completed   TransactionStatus = "Completed"
    Failed      TransactionStatus = "Failed"
    Refunded    TransactionStatus = "Refunded"
)

type EscrowPayment struct {
    gorm.Model
    EscrowID       uint      `gorm:"not null" json:"escrow_id"`
    BuyerID         uint      `gorm:"not null" json:"buyer_id"`
    TransactionRef string    `gorm:"unique;not null" json:"transaction_ref"`
    Amount         float64   `gorm:"type:decimal(16,2);not null" json:"amount"`
    Currency       string    `gorm:"size:3;not null" json:"currency"`
    Status         TransactionStatus `gorm:"not null" json:"status"`
    PaymentURL     string    `gorm:"type:text" json:"payment_url,omitempty"` 
}