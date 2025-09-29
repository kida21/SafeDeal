package utils

import (
	"escrow_service/internal/model"
	"gorm.io/gorm"
)

func AddContact(db *gorm.DB, buyerID, sellerID, escrowID uint) error {
	// Add buyer -> seller
	if err := addToContacts(db, buyerID, sellerID, escrowID); err != nil {
		return err
	}

	// Add seller -> buyer
	if err := addToContacts(db, sellerID, buyerID, escrowID); err != nil {
		return err
	}

	return nil
}

func addToContacts(db *gorm.DB, userID, targetID, escrowID uint) error {
	var contact model.Contact
	err := db.Where("user_id = ? AND target_id = ?", userID, targetID).First(&contact).Error

	if err != nil {
		// Not found → create
		contact = model.Contact{
			UserID:   userID,
			TargetID: targetID,
			EscrowID: escrowID,
		}
		return db.Create(&contact).Error
	}

	// Already exists → update escrow ID if needed
	if contact.EscrowID != escrowID {
		contact.EscrowID = escrowID
		return db.Save(&contact).Error
	}

	return nil
}