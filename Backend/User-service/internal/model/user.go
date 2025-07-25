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
	
    
}