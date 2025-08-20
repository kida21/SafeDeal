package main

import (
	blockchain "blockchain_adapter"
	"log"
	"net"
	"payment_service/internal"
	"payment_service/internal/consul"
	"payment_service/internal/db"
	"payment_service/internal/handlers"
	"payment_service/internal/model"
	"payment_service/internal/server"

	payment "github.com/SafeDeal/proto/payment/v1"
	"github.com/ethereum/go-ethereum/accounts/abi/bind"
	"github.com/gofiber/fiber/v3"
	"google.golang.org/grpc"
	"gorm.io/gorm"
)
var blockchainClient *blockchain.Client
func startGRPCServer(db *gorm.DB) {
    lis, err := net.Listen("tcp", ":50053")
    if err != nil {
        log.Fatalf("failed to listen: %v", err)
    }

    s := grpc.NewServer()
    payment.RegisterPaymentServiceServer(s,server.NewPaymentServer(db))

    log.Println("gRPC server running on :50053")

    if err := s.Serve(lis); err != nil {
        log.Fatalf("failed to serve gRPC: %v", err)
    }
}
func main() {
    db.ConnectDB()
    db.DB.AutoMigrate(&model.EscrowPayment{})
	go startGRPCServer(db.DB)
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