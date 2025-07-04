package auth

import (
	"context"

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

func (c *UserServiceClient) VerifyToken(token string) (*v0.VerifyTokenResponse, error) {
    client := v0.NewAuthServiceClient(c.conn)
    return client.VerifyToken(context.Background(), &v0.VerifyTokenRequest{Token: token})
}