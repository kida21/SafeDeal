package main

import (
	"api_gateway/internal"
	"api_gateway/internal/consul"
    "github.com/gofiber/fiber/v3"
    
)


func main() {
    internal.InitRedis()
    consul.InitConsul()
    app := fiber.New()
    internal.SetupRoutes(app)
    app.Listen(":8080")
}
