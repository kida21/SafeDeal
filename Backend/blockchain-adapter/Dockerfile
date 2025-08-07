FROM golang:latest AS builder

WORKDIR /app

COPY Backend/blockchain-adapter/go.mod ./Backend/blockchain-adapter/go.mod

COPY Backend/blockchain-adapter/go.sum ./Backend/blockchain-adapter/go.sum

COPY contracts ./contracts

COPY Backend/blockchain-adapter ./Backend/blockchain-adapter

WORKDIR /app/Backend/blockchain-adapter

RUN go mod tidy && go mod download

RUN CGO_ENABLED=0 go build -v -o /blockchain-adapter blockchain.go

FROM gcr.io/distroless/static-debian12
    
COPY --from=builder /blockchain-adapter /blockchain-adapter

EXPOSE 8084
    
CMD ["/blockchain-adapter"]