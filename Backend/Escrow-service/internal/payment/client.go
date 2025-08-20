package payment

import (
	"context"

	"github.com/SafeDeal/proto/payment/v1"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"
)

type PaymentServiceClient struct {
	conn *grpc.ClientConn
}

func NewPaymentServiceClient(addr string) (*PaymentServiceClient, error) {
    conn, err :=  grpc.NewClient(addr,grpc.WithTransportCredentials(insecure.NewCredentials()))
    if err != nil {
        return nil, err
    }
    return &PaymentServiceClient{conn: conn}, nil
}

func (P * PaymentServiceClient)Finalize(data string)(*v1.FinalizeEscrowResponse,error){
	client:=v1.NewPaymentServiceClient(P.conn)
	return client.FinalizeEscrow(context.Background(),&v1.FinalizeEscrowRequest{Data: data})
}
