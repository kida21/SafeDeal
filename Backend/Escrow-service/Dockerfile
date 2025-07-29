FROM golang:latest AS builder

WORKDIR /app
    
RUN apt-get update && \
        apt-get install --no-install-recommends -y direnv && \
        rm -rf /var/lib/apt/lists/*
        
COPY Backend/Escrow-service/go.mod ./Backend/Escrow-service/go.mod

COPY Backend/Escrow-service/go.sum ./Backend/Escrow-service/go.sum

COPY Backend/Escrow-service/.envrc ./Backend/Escrow-service/.envrc
    
COPY proto/auth ./Proto/auth

COPY proto/escrow ./Proto/escrow

COPY message-broker ./message-broker

COPY Backend/Escrow-service ./Backend/Escrow-service

WORKDIR /app/Backend/Escrow-service
    
RUN direnv allow .
    
RUN go mod tidy && go mod download
    
RUN CGO_ENABLED=0 go build -v -o /escrow-service ./cmd/api
    
FROM gcr.io/distroless/static-debian12
    
COPY --from=builder /escrow-service /escrow-service
    
EXPOSE 8082
    
CMD ["/escrow-service"]
    