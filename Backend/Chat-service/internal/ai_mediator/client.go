package ai_mediator

import (
    "context"
    "time"

    "google.golang.org/grpc"
    "google.golang.org/grpc/credentials/insecure"
    v1 "github.com/SafeDeal/proto/ai-arbitrator/v1"
)

// AiArbitratorClient represents the gRPC client for the AI Arbitrator service.
type AiArbitratorClient struct {
    conn *grpc.ClientConn
}

// NewAiArbitratorClient creates a new client for the AI Arbitrator service.
// It takes the gRPC address as a string and returns a pointer to the client.
func NewAiArbitratorClient(addr string) (*AiArbitratorClient, error) {
    // Set a timeout for the connection attempt
    ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
    defer cancel()
    
    // Use an insecure connection for local development
    conn, err := grpc.DialContext(ctx, addr, grpc.WithTransportCredentials(insecure.NewCredentials()))
    if err != nil {
        return nil, err
    }
    return &AiArbitratorClient{conn: conn}, nil
}

// Close closes the gRPC client connection. It's a good practice to defer this
// call when you open a connection.
func (c *AiArbitratorClient) Close() {
    c.conn.Close()
}

// RequestMediation calls the RequestMediation method on the AI Arbitrator service.
// It passes the necessary data to the AI service for mediation.
func (c *AiArbitratorClient) RequestMediation(ctx context.Context, req *v1.MediationRequest) (*v1.MediationResponse, error) {
    client := v1.NewAIArbitratorClient(c.conn)
    return client.RequestMediation(ctx, req)
}

// RequestDecision calls the RequestDecision method on the AI Arbitrator service.
// It sends the dispute details to the AI service for a final decision.
func (c *AiArbitratorClient) RequestDecision(ctx context.Context, req *v1.DecisionRequest) (*v1.DecisionResponse, error) {
    client := v1.NewAIArbitratorClient(c.conn)
    return client.RequestDecision(ctx, req)
}
