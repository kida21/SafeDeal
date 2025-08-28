package server

import (
	"context"
	"log"
	"payment_service/internal/escrow"
	"payment_service/internal/rabbitmq"
	"strconv"
	"strings"

	"github.com/SafeDeal/proto/payment/v1"
	"gorm.io/gorm"
)

type PaymentServer struct{
  v1.UnimplementedPaymentServiceServer
  DB *gorm.DB
}
func NewPaymentServer(db *gorm.DB) *PaymentServer {
    return &PaymentServer{DB: db}
}

func (s *PaymentServer) FinalizeEscrow(ctx context.Context, req *v1.FinalizeEscrowRequest) (*v1.FinalizeEscrowResponse, error) {
	escrowIDStr := strings.TrimPrefix(req.Data, "escrow-")
	escrowID, err := strconv.ParseUint(escrowIDStr, 10, 64)
	if err != nil {
		return &v1.FinalizeEscrowResponse{
			Success: false,
			Error:   "Invalid reference",
		}, nil
	}

	escrowClient,err:=escrow.NewEscrowServiceClient("escrow-service:50052")
	if err!=nil{
	   log.Printf("unable to call escrow-service: %v",err)
	}
	resp,err:= escrowClient.GetEscrow(uint32(escrowID))
	if err!=nil{
		 return &v1.FinalizeEscrowResponse{
			Success: false,
			Error:   "Escrow not found",
		}, nil
	}
	

	if resp.BlockchainEscrowId == 0 {
		return &v1.FinalizeEscrowResponse{
			Success: false,
			Error:   "Escrow not linked to blockchain",
		}, nil
	}

    id:=uint64(resp.BlockchainEscrowId)
	producer := rabbitmq.NewProducer()
	err = producer.PublishTransferSuccess(req.Data, escrowID, &id)

	if err != nil {
		log.Printf("❌ Failed to publish transfer.success: %v", err)
		return &v1.FinalizeEscrowResponse{
			Success: false,
			Error:   "Failed to publish event",
		}, nil
	}

	log.Print("✅ Published transfer.success")

	return &v1.FinalizeEscrowResponse{
		Success: true,
	}, nil
}