package session

import (
	"context"
	"strconv"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/redis/go-redis/v9"
)

var redisClient *redis.Client = nil

const (
    SessionPrefix     = "session:"
    TokenRevokedPrefix = "token:"
    SessionTTL        = 72 * time.Hour
)

func InitSession(r *redis.Client) {
    redisClient = r
}


func GenerateSessionID(userID uint) string {
    sessionID := uuid.New().String()
    key := SessionPrefix + sessionID
    ctx := context.Background()

    redisClient.Set(ctx, key, userID, SessionTTL)
    return sessionID
}


func ValidateSession(sessionID string, expectedUserID uint) bool {
    ctx := context.Background()
    key := SessionPrefix + sessionID

    val, err := redisClient.Get(ctx, key).Result()
    if err != nil {
        return false
    }

    userID, _ := strconv.Atoi(val)
    return userID == int(expectedUserID)
}


func RevokeSession(sessionID string) error {
    ctx := context.Background()
    key := TokenRevokedPrefix + sessionID
    return redisClient.Set(ctx, key, "revoked", SessionTTL).Err()
}


func RevokeAllSessionsForUser(userID uint) error {
    ctx := context.Background()

    
    iter := redisClient.Scan(ctx, 0, SessionPrefix+"*", 0).Iterator()

    for iter.Err() == nil && iter.Next(ctx) {  
        key := iter.Val()
        val, err := redisClient.Get(ctx, key).Result()
        if err != nil {
            continue
        }

        if val == strconv.Itoa(int(userID)) {
            
            sessionID := strings.TrimPrefix(key, SessionPrefix)
           
            redisClient.Set(ctx, TokenRevokedPrefix+sessionID, "revoked", SessionTTL)
            
            redisClient.Del(ctx, key)
        }
    }

    if err := iter.Err(); err != nil {
        return err
    }

    return nil
}