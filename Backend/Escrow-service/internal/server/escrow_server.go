// internal/grpc/escrow_server.go
package server

import (
    "context"
    "fmt"
    "github.com/SafeDeal/proto/escrow/v1"
    "gorm.io/gorm"
    "escrow_service/internal/model"
)

type EscrowServer struct {
    v1.UnimplementedEscrowServiceServer
    DB *gorm.DB
}

func NewEscrowServer(db *gorm.DB) *EscrowServer {
    return &EscrowServer{DB: db}
}

func (s *EscrowServer) UpdateStatus(ctx context.Context, req *v1.UpdateEscrowStatusRequest) (*v1.UpdateEscrowStatusResponse, error) {
    var escrow model.Escrow
    if err := s.DB.First(&escrow, req.EscrowId).Error; err != nil {
        return &v1.UpdateEscrowStatusResponse{
            Success: false,
            Message: fmt.Sprintf("Escrow %d not found", req.EscrowId),
        }, nil
    }

    escrow.Status = model.EscrowStatus(req.NewStatus)
	if err := s.DB.Save(&escrow).Error; err != nil {
        return &v1.UpdateEscrowStatusResponse{
            Success: false,
            Message: "Failed to update status",
        }, nil
    }

    return &v1.UpdateEscrowStatusResponse{
        Success: true,
        Message: fmt.Sprintf("Escrow %d updated to %s", req.EscrowId, req.NewStatus),
    }, nil
}

func (s *EscrowServer) GetEscrow(ctx context.Context, req *v1.GetEscrowRequest) (*v1.EscrowResponse, error) {
    var escrow model.Escrow
    if err := s.DB.First(&escrow, req.EscrowId).Error; err != nil {
        return nil, fmt.Errorf("escrow not found")
    }

    return &v1.EscrowResponse{
        Id:         uint32(escrow.ID),
        BuyerId:    uint32(escrow.BuyerID),
        SellerId:   uint32(escrow.SellerID),
        Amount:     float32(escrow.Amount),
        Status:     string(escrow.Status),
        Conditions: escrow.Conditions,
        BlockchainEscrowId: uint32(*escrow.BlockchainEscrowID),
    }, nil
}