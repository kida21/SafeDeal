package session

import (
	"context"
	"strconv"
	"time"

	"github.com/redis/go-redis/v9"
	"github.com/google/uuid"
)

var redisClient *redis.Client = nil 

func InitRedis(r *redis.Client) {
	redisClient = r
}
//creates a unique session ID and stores it in Redis
func GenerateSessionID(userID uint) string {
    sessionID := uuid.New().String()
    key := "session:" + sessionID
    ctx := context.Background()

    
    redisClient.Set(ctx, key, userID, 72*time.Hour)

    return sessionID
}

// checks if the session ID is valid and belongs to the user
func ValidateSession(sessionID string, expectedUserID uint) bool {
    ctx := context.Background()
    key := "session:" + sessionID

    val, err := redisClient.Get(ctx, key).Result()
    if err != nil {
        return false
    }

    userID, _ := strconv.Atoi(val)
    return userID == int(expectedUserID)
}

// invalidates a session 
func RevokeSession(sessionID string) error {
    ctx := context.Background()
    key := "session:" + sessionID
    return redisClient.Del(ctx, key).Err()
}

// removes all sessions for a user
func RevokeAllSessionsForUser(userID uint) error {
    ctx := context.Background()
    keys, _ := redisClient.Keys(ctx, "session:*").Result()

    for _, key := range keys {
        val, _ := redisClient.Get(ctx, key).Result()
        if val == strconv.Itoa(int(userID)) {
            redisClient.Del(ctx, key)
        }
    }
    return nil
}
