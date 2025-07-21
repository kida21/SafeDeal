package main

import (
	"api_gateway/internal"
	"api_gateway/internal/consul"

	"github.com/gofiber/fiber/v3"
)

func main() {
    
    consul.InitConsul()
    app := fiber.New()
    internal.SetupRoutes(app)
    app.Listen(":8080")
}