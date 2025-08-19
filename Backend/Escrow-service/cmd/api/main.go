package main

import (
	blockchain "blockchain_adapter"
	"escrow_service/internal"
	"escrow_service/internal/consul"
	"escrow_service/internal/db"
	"escrow_service/internal/handlers"
	"escrow_service/internal/model"
	"escrow_service/internal/rabbitmq"
	"escrow_service/internal/server"
	"log"
	"net"

	escrow "github.com/SafeDeal/proto/escrow/v1"
	"github.com/ethereum/go-ethereum/accounts/abi/bind"
	"github.com/gofiber/fiber/v3"
	"google.golang.org/grpc"
	"gorm.io/gorm"
)
var blockchainClient *blockchain.Client
func startGRPCServer(db *gorm.DB) {
    lis, err := net.Listen("tcp", ":50052")
    if err != nil {
        log.Fatalf("failed to listen: %v", err)
    }

    s := grpc.NewServer()
    escrow.RegisterEscrowServiceServer(s, server.NewEscrowServer(db))

    log.Println("gRPC server running on :50052")

    if err := s.Serve(lis); err != nil {
        log.Fatalf("failed to serve gRPC: %v", err)
    }
}

func main() {
    db.ConnectDB()
   
    db.DB.AutoMigrate(&model.Escrow{})
    go startGRPCServer(db.DB)
    consul.RegisterService("escrow-service", "escrow-service", 8082)
    
     
    
    var err error
	blockchainClient, err = blockchain.NewClient()
	if err != nil {
		log.Fatalf("Failed to initialize blockchain client: %v", err)
	}
    nextID, err := blockchainClient.Contract.NextId(&bind.CallOpts{})
	if err != nil {
		log.Fatalf("Contract call failed: %v", err)
	}
    handlers.SetBlockchainClient(blockchainClient)
	log.Printf("Connected to contract. Next ID: %d", nextID)
    
    consumer := rabbitmq.NewConsumer(db.DB,blockchainClient)
    go consumer.Listen()                    
	go consumer.ListenForTransferEvents()

    app := fiber.New()

    app.Get("/health", func(c fiber.Ctx) error {
        return c.SendString("OK")
    })
    internal.SetupRoutes(app, db.DB)

    app.Listen(":8082")
}