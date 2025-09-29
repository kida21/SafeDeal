FROM golang:1.25-alpine3.22 AS builder

WORKDIR /app

COPY Backend/payment-service/go.mod ./Backend/Payment-service/go.mod

COPY Backend/payment-service/go.sum ./Backend/Payment-service/go.sum

COPY proto/auth ./Proto/auth

COPY proto/escrow ./Proto/escrow

COPY proto/payment ./Proto/payment

COPY message-broker ./message-broker

COPY Backend/blockchain-adapter Backend/blockchain-adapter

COPY contracts contracts

COPY Backend/payment-service ./Backend/Payment-service

WORKDIR /app/Backend/Payment-service

RUN go mod tidy && go mod download

RUN CGO_ENABLED=0 go build -v -o /payment-service ./cmd/api

FROM gcr.io/distroless/static-debian12

COPY --from=builder /payment-service /payment-service

EXPOSE 8083

CMD ["/payment-service"]
