package ratelimit

import (
    "context"
    "fmt"
    "time"
     "github.com/redis/go-redis/v9"
    
)

type RateLimiter struct {
    RedisClient *redis.Client
    Limit       int
    Window      time.Duration
}

func NewRateLimiter(redisClient *redis.Client, limit int, window time.Duration) *RateLimiter {
    return &RateLimiter{
        RedisClient: redisClient,
        Limit:       limit,
        Window:      window,
    }
}


func (rl *RateLimiter) Allow(key string) bool {
    ctx := context.Background()
    now := time.Now().Unix()
    windowStart := now - int64(rl.Window.Seconds())

    pipeline := rl.RedisClient.Pipeline()
    pipeline.ZRemRangeByScore(ctx, key, "0", fmt.Sprint(windowStart))

    current := fmt.Sprint(now)
    pipeline.ZAdd(ctx, key, redis.Z{Score: float64(now), Member: current})

    
    pipeline.ZCard(ctx, key)
    pipeline.Expire(ctx, key, rl.Window)

    
    cmders, err := pipeline.Exec(ctx)
    if err != nil {
        return false
    }

    count := cmders[len(cmders)-1].(*redis.IntCmd).Val()
    return count <= int64(rl.Limit)
}