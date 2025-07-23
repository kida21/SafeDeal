package middleware

import (
	
	"fmt"

	"api_gateway/internal/ratelimter"

	"github.com/gofiber/fiber/v3"
)


func RateLimitByUser(limiter *ratelimit.RateLimiter) fiber.Handler {
    return func(c fiber.Ctx) error {
        userID := c.Get("X-User-ID")
        if userID == "" {
            return c.Next()
        }

        key := fmt.Sprintf("rate_limit:user:%s", userID)
        allowed, err := limiter.Allow(key)
        if err != nil {
            
            fmt.Printf("Redis error in rate limit for user %s: %v\n", userID, err)
            return c.Next()
        }

        if !allowed {
            return c.Status(fiber.StatusTooManyRequests).JSON(fiber.Map{
                "error": fmt.Sprintf("Rate limit exceeded: %d requests per %s", limiter.Limit, limiter.Window),
            })
        }

        return c.Next()
    }
}


func RateLimitByIP(limiter *ratelimit.RateLimiter) fiber.Handler {
    return func(c fiber.Ctx) error {
        ip := c.IP()
        key := fmt.Sprintf("rate_limit:ip:%s", ip)

        allowed, err := limiter.Allow(key)
        if err != nil {
            fmt.Printf("Redis error in rate limit for IP %s: %v\n", ip, err)
            return c.Next()
        }

        if !allowed {
            return c.Status(fiber.StatusTooManyRequests).JSON(fiber.Map{
                "error": fmt.Sprintf("Rate limit exceeded: %d requests per %s", limiter.Limit, limiter.Window),
            })
        }

        return c.Next()
    }
}