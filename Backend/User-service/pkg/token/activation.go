package token

import (
    "crypto/rand"
    "encoding/hex"
    "user_service/internal/model"
    "gorm.io/gorm"
)

func GenerateActivationToken() string {
    b := make([]byte, 16)
    rand.Read(b)
    return hex.EncodeToString(b)
}

func ValidateActivationToken(db *gorm.DB, token string) (uint, error) {
    var user model.User
    if err := db.Where("activation_token = ?", token).First(&user).Error; err != nil {
        return 0, err
    }
    return user.ID, nil
}