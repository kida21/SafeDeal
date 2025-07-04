package handlers

import (
    "github.com/golang-jwt/jwt/v5"
)

type CustomClaims struct {
    UserID uint32 `json:"user_id"`
    jwt.RegisteredClaims
}