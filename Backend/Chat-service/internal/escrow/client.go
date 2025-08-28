package escrow

import (
	"context"
	"github.com/SafeDeal/proto/escrow/v1"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"
)

type EscrowServiceClient struct {
    conn *grpc.ClientConn
}

func NewEscrowServiceClient(addr string) (*EscrowServiceClient, error) {
    conn, err :=  grpc.NewClient(addr,grpc.WithTransportCredentials(insecure.NewCredentials()))
    if err != nil {
        return nil, err
    }
    return &EscrowServiceClient{conn: conn}, nil
}

func (c *EscrowServiceClient) GetEscrow(id uint32) (*v1.EscrowResponse, error) {
    client := v1.NewEscrowServiceClient(c.conn)
    return client.GetEscrow(context.Background(), &v1.GetEscrowRequest{EscrowId: id})
}