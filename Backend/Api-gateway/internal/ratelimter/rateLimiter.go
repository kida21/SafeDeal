package ratelimter

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
    if redisClient == nil {
        panic("RateLimiter: redisClient cannot be nil")
    }
    return &RateLimiter{
        RedisClient: redisClient,
        Limit:       limit,
        Window:      window,
    }
}


func (rl *RateLimiter) Allow(ctx context.Context, key string) (bool, error) {
    if rl.RedisClient == nil {
        return false, fmt.Errorf("Redis client is not initialized")
    }

    now := time.Now().Unix()
    windowStart := now - int64(rl.Window.Seconds())
    fmt.Printf("Key: %s | Window: [%d, %d]\n", key, windowStart, now)

    pipe := rl.RedisClient.TxPipeline()

    
    pipe.ZRemRangeByScore(ctx, key, "0", fmt.Sprint(windowStart))
    pipe.ZAdd(ctx, key, redis.Z{ 
        Score:  float64(now),
        Member: fmt.Sprint(now),
    })

    
    countCmd := pipe.ZCount(ctx, key, fmt.Sprint(windowStart), fmt.Sprint(now))

    
    pipe.Expire(ctx, key, rl.Window)
    _, err := pipe.Exec(ctx)
    if err != nil {
         fmt.Printf("Redis error: %v\n", err)
        return false, err
    }

    
    count, err := countCmd.Result()
    if err != nil {
        return false, err
    }
    fmt.Printf("Current count: %d (limit: %d)\n", count, rl.Limit)
    return count <= int64(rl.Limit), nil
}