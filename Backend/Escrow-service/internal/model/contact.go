package model

import "gorm.io/gorm"

type Contact struct {
	gorm.Model
	UserID   uint `gorm:"not null;index:idx_contact_user_target,unique"`
	TargetID uint `gorm:"not null;index:idx_contact_user_target,unique"`
	EscrowID uint `gorm:"not null"`
}