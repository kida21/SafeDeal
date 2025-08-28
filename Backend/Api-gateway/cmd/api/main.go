package main

import (
	"api_gateway/internal"
	"api_gateway/internal/consul"
	"api_gateway/internal/middleware"

	"github.com/gofiber/fiber/v2"
)

func main() {
	
	internal.InitRedis()
    consul.InitConsul()
    app := fiber.New()
    app.Use(middleware.CORSMiddleware())
    internal.SetupRoutes(app)
    app.Listen(":8080")
}
