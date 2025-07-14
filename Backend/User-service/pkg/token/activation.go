package token

import (
    "context"
    "time"

    "github.com/google/uuid"
    "github.com/redis/go-redis/v9"
)

var redisClient *redis.Client

func SetRedisClient(client *redis.Client) {
    redisClient = client
}


func GenerateActivationToken(email string) string {
    token := uuid.New().String()

    err := redisClient.Set(context.Background(), "activation:"+token, email, 15*time.Minute).Err()
    if err != nil {
        panic("Failed to store token in Redis")
    }

    return token
}

// ValidateActivationToken checks if token exists and returns associated email
func ValidateActivationToken(token string) (string, bool) {
    email, err := redisClient.Get(context.Background(), "activation:"+token).Result()
    if err != nil {
        return "", false
    }

    return email, true
}

// DeleteActivationToken removes token after activation
func DeleteActivationToken(token string) error {
    return redisClient.Del(context.Background(), "activation:"+token).Err()
}