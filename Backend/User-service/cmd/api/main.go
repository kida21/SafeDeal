package main

import (
	"log"
	"net"
	"user_service/internal"
	"user_service/internal/auth"
	"user_service/internal/db"
	"user_service/internal/handlers"
	"user_service/internal/model"
	"user_service/pkg/redis"
	"user_service/pkg/refresh"
	"user_service/pkg/session"

	proto "github.com/SafeDeal/proto/auth/v0"
	"github.com/gofiber/fiber/v3"
	"google.golang.org/grpc"
)

func startGRPCServer() {
    lis, err := net.Listen("tcp", ":50051")
    if err != nil {
        log.Fatalf("failed to listen: %v", err)
    }

    s := grpc.NewServer()
    proto.RegisterAuthServiceServer(s, &auth.AuthServer{RedisClient: redisclient.Client})
    log.Println("gRPC server running on port :50051")

    if err := s.Serve(lis); err != nil {
        log.Fatalf("failed to serve gRPC: %v", err)
    }
}
func main() {
    redisclient.InitRedis()
    db.ConnectDB()
    // db.DB.Exec("DROP TABLE IF EXISTS users")(for development purpose)
    db.DB.AutoMigrate(&model.User{})
    go startGRPCServer()
    
    handlers.SetRedisClient(redisclient.Client)
    session.InitSession(redisclient.Client)
    refresh.InitRefresh(redisclient.Client)
    app := fiber.New()
    internal.SetupRoutes(app, db.DB)

    app.Listen(":8081")
}