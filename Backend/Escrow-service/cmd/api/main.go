package main

import (
	"escrow_service/internal"
	"escrow_service/internal/consul"
	"escrow_service/internal/db"
	"escrow_service/internal/model"
	"escrow_service/internal/rabbitmq"
	"escrow_service/internal/server"
	"log"
	"net"

	escrow "github.com/SafeDeal/proto/escrow/v1"
	"github.com/gofiber/fiber/v3"
	"google.golang.org/grpc"
	"gorm.io/gorm"
)
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

    consumer := rabbitmq.NewConsumer(db.DB)
    consumer.Listen()

    app := fiber.New()

    app.Get("/health", func(c fiber.Ctx) error {
        return c.SendString("OK")
    })
    internal.SetupRoutes(app, db.DB)

    app.Listen(":8082")
}