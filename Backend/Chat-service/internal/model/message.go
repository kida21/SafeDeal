package model

import "gorm.io/gorm"

type Message struct {
	gorm.Model
	EscrowID uint   `gorm:"not null"`
	SenderID uint   `gorm:"not null"`
	Content  string `gorm:"not null"`
}