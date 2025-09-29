FROM golang:1.25-alpine3.22 AS builder

WORKDIR /app
    
COPY Backend/Escrow-service/go.mod ./Backend/Escrow-service/go.mod

COPY Backend/Escrow-service/go.sum ./Backend/Escrow-service/go.sum

COPY Backend/blockchain-adapter/go.mod Backend/blockchain-adapter/go.mod

COPY Backend/blockchain-adapter/go.sum Backend/blockchain-adapter/go.sum

COPY proto/auth ./Proto/auth

COPY proto/escrow ./Proto/escrow

COPY proto/payment ./Proto/payment

COPY message-broker ./message-broker

COPY Backend/blockchain-adapter Backend/blockchain-adapter

COPY shared  ./shared

COPY contracts contracts

COPY Backend/Escrow-service ./Backend/Escrow-service

WORKDIR /app/Backend/Escrow-service
    
    
RUN go mod tidy && go mod download
    
RUN CGO_ENABLED=0 go build -v -o /escrow-service ./cmd/api
    
FROM gcr.io/distroless/static-debian12
    
COPY --from=builder /escrow-service /escrow-service
    
EXPOSE 8082
    
CMD ["/escrow-service"]
    