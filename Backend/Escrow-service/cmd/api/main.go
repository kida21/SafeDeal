package main

import (
    "escrow_service/internal"
    "escrow_service/internal/db"
    "github.com/gofiber/fiber/v3"
	"escrow_service/internal/model"
)

func main() {
    db.ConnectDB()
    db.DB.AutoMigrate(&model.Escrow{})

    app := fiber.New()
    internal.SetupRoutes(app, db.DB)

    app.Listen(":8082")
}