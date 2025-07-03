package redisclient

import (
	"context"
	"fmt"

	"github.com/redis/go-redis/v9"
)

var Ctx = context.Background()
var Client *redis.Client

func InitRedis() {
    Client = redis.NewClient(&redis.Options{
        Addr:     "redis:6379",
        Password: "",
        DB:       0,
    })
    _, err := Client.Ping(Ctx).Result()
    if err != nil {
        panic("Failed to connect to Redis")
    }

    fmt.Println("Connected to Redis")
}
