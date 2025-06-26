package main

import (
	"user_service/internal"
	"user_service/internal/db"
	"user_service/internal/model"

	"github.com/gofiber/fiber/v3"
)

func main() {
    db.ConnectDB()
    db.DB.AutoMigrate(&model.User{})

    app := fiber.New()
    internal.SetupRoutes(app, db.DB)

    app.Listen(":8081")
}