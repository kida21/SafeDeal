package model

import "gorm.io/gorm"


type User struct {
    gorm.Model
    ID        uint   `json:"id" gorm:"primaryKey"`
    FirstName string `json:"first_name" gorm:"column:first_name;not null"`
    LastName  string `json:"last_name" gorm:"column:last_name;not null"`
    Email     string `json:"email" gorm:"uniqueIndex;not null"`
    Password  string `json:"-" gorm:"not null"`
    Activated bool   `json:"activated" gorm:"default:false"`
    Version   int    `json:"version" gorm:"default:1"`
    WalletAddress  *string `gorm:"unique;type:varchar(42)"` 
    EncryptedPrivateKey *string `gorm:"type:text"`  
	AccountName     *string `gorm:"type:varchar(100)"`
	AccountNumber   *string `gorm:"type:varchar(50)"`
	BankCode        *int    `gorm:"type:int"`
    
}