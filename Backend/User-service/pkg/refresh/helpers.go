package refresh

import (
	"context"
	"strconv"
	"time"

	"github.com/google/uuid"
	"github.com/redis/go-redis/v9"
)

var redisClient *redis.Client = nil
var ctx = context.Background()

func InitRefresh(r *redis.Client) {
    redisClient = r
}

// creates a new refresh token and stores it in Redis
func GenerateRefreshToken(sessionID string) string {
    rt := uuid.New().String()
    key := "refresh:" + rt
    redisClient.Set(ctx, key, sessionID, 7*24*time.Hour)
    return rt
}

// checks if refresh token is valid and returns linked session ID
func ValidateRefreshToken(token string) (bool, string) {
    key := "refresh:" + token
    sessionID, err := redisClient.Get(ctx, key).Result()
    if err != nil {
        return false, ""
    }
    return true, sessionID
}

// removes refresh token from Redis
func RevokeRefreshToken(token string) error {
    key := "refresh:" + token
    return redisClient.Del(ctx, key).Err()
}

// clears all refresh tokens tied to a user
func RevokeAllRefreshTokensForUser(userID uint) error {
    keys, _ := redisClient.Keys(ctx, "refresh:*").Result()

    for _, key := range keys {
        sessionID, _ := redisClient.Get(ctx, key).Result()
        if sessionID == strconv.Itoa(int(userID)) {
            _ = redisClient.Del(ctx, key).Err()
        }
    }
    return nil
}

