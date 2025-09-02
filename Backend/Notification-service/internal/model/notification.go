package model

import "time"

type Notification struct {
	ID        uint      `gorm:"primaryKey"`
	UserID    uint      `gorm:"not null;index"`
	Type      string    `gorm:"not null"`
	Title     string    `gorm:"not null"`
	Message   string    `gorm:"not null"`
	Read      bool      `gorm:"default:false"`
	Metadata  string    `gorm:"type:text"`
	CreatedAt time.Time
}