// internal/escrow/client.go
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

func (c *EscrowServiceClient) UpdateEscrowStatus(escrowID uint32, newStatus string) error {
    client := v1.NewEscrowServiceClient(c.conn)
    _, err := client.UpdateStatus(context.Background(), &v1.UpdateEscrowStatusRequest{
        EscrowId:  escrowID,
        NewStatus: newStatus,
    })
    return err
}