package auth

import (
	"context"
	"time"

	"github.com/SafeDeal/proto/auth/v0"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"
)

type UserServiceClient struct {
    conn *grpc.ClientConn
}

func NewUserServiceClient(addr string) (*UserServiceClient, error) {
    conn, err := grpc.NewClient(addr,grpc.WithTransportCredentials(insecure.NewCredentials()))// insecure for development purpose
    if err != nil {
        return nil, err
    }
    
    return &UserServiceClient{conn: conn}, nil
}

func (c *UserServiceClient) Close() error {
    return c.conn.Close()
}

func (c *UserServiceClient) GetUser(userID uint32) (*v0.User, error) {
     client := v0.NewAuthServiceClient(c.conn)
    ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
    defer cancel()
    resp, err := client.GetUser(ctx, &v0.GetUserRequest{UserId: userID})
    if err != nil {
        return nil, err
    }
    if !resp.Success {
        return nil, context.DeadlineExceeded
    }
    return resp.User, nil
}


