package redisclient

import (
	"context"
	"fmt"
	"time"

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

func IsProcessed(txRef string) bool {
	val, _ := Client.Get(context.Background(), "webhook:"+txRef).Result()
	return val == "1"
}

func MarkAsProcessed(txRef string) {
	Client.Set(context.Background(), "webhook:"+txRef, "1", 5*time.Minute)
}
