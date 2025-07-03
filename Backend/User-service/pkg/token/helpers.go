package token

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
func GenerateRefreshToken(userID uint) string {
	rt := uuid.New().String()
	key := "refresh:" + rt
	ctx := context.Background()
   redisClient.Set(ctx, key, userID, 7*24*time.Hour)
	return rt
}

func ValidateRefreshToken(token string) (bool, uint) {
	ctx := context.Background()
	key := "refresh:" + token

	val, err := redisClient.Get(ctx, key).Result()
	if err != nil {
		return false, 0
	}

	userID, _ := strconv.Atoi(val)
	return true, uint(userID)
}
//  deletes the refresh token from redis
func RevokeRefreshToken(token string) error {
	ctx := context.Background()
	key := "refresh:" + token
	return redisClient.Del(ctx, key).Err()
}

// checks if access token is blacklisted
func IsAccessTokenRevoked(token string) bool {
	ctx := context.Background()
	val, _ := redisClient.Get(ctx, "token:"+token).Result()
	return val == "revoked"
}

// adds access token to blacklist
func RevokeAccessToken(token string, exp time.Time) {
	ctx := context.Background()
	redisClient.Set(ctx, "token:"+token, "revoked", exp.Sub(time.Now()))
}
