package model

import "gorm.io/gorm"

type Role string

const (
    Customer Role = "customer"
    
)

type User struct {
    gorm.Model
    Email    string `gorm:"unique" json:"email"`
    Password string `json:"password"`
    Role     Role   `json:"role"`
    Token    string `json:"token,omitempty"`
}