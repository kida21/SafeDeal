package redisclient

import (
    "context"
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
}
