package model

import "gorm.io/gorm"

type Role string

const (
    Customer Role = "customer"
    
)

type User struct {
    gorm.Model
    ID        uint   `json:"id" gorm:"primaryKey"`
    FirstName string `json:"firstname"`
	LastName string `json:"lastname"`
    Email    string `gorm:"unique" json:"email"`
    Password string `json:"password"`
	Role     Role   `json:"role"`
    
}