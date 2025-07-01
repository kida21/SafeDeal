package main

import (
    "net"
    "log"
    "escrow_service/internal"
    "escrow_service/internal/db"
    "github.com/gofiber/fiber/v3"
	"escrow_service/internal/model"
    "gorm.io/gorm"
    "google.golang.org/grpc"
    escrow"github.com/SafeDeal/proto/escrow/v1"
    "escrow_service/internal/server"
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
    app := fiber.New()
    internal.SetupRoutes(app, db.DB)

    app.Listen(":8082")
}