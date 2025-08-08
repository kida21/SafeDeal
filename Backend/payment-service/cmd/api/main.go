package main

import (
	blockchain "blockchain_adapter"
	"log"
	"payment_service/internal"
	"payment_service/internal/consul"
	"payment_service/internal/db"
	"payment_service/internal/handlers"
	"payment_service/internal/model"

	"github.com/ethereum/go-ethereum/accounts/abi/bind"
	"github.com/gofiber/fiber/v3"
)
var blockchainClient *blockchain.Client
func main() {
    db.ConnectDB()
    db.DB.AutoMigrate(&model.EscrowPayment{})
    consul.RegisterService("payment-service", "payment-service", 8083)

    var err error
	blockchainClient, err = blockchain.NewClient()
	if err != nil {
		log.Fatalf("Failed to initialize blockchain client: %v", err)
	}
    nextID, err := blockchainClient.Contract.NextId(&bind.CallOpts{})
	if err != nil {
		log.Fatalf("Contract call failed: %v", err)
	}
	log.Printf("Connected to contract. Next ID: %d", nextID)
    
   handlers.SetBlockchainClient(blockchainClient)
   
    app := fiber.New()

    app.Get("/health", func(c fiber.Ctx) error {
        return c.SendString("OK")
    })
    internal.SetupRoutes(app, db.DB)
    
   if err := app.Listen(":8083"); err != nil {
        panic("Failed to start Payment Service: " + err.Error())
    }
}