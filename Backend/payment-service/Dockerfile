
FROM golang:latest AS builder

WORKDIR /app

RUN apt-get update && \
    apt-get install --no-install-recommends -y direnv && \
    rm -rf /var/lib/apt/lists/*

COPY Backend/Payment-service/go.mod ./Backend/Payment-service/go.mod

COPY Backend/Payment-service/go.sum ./Backend/Payment-service/go.sum

COPY Backend/Payment-service/.envrc ./Backend/Payment-service/.envrc

COPY proto/auth ./Proto/auth

COPY proto/escrow ./Proto/escrow

COPY message-broker ./message-broker

COPY Backend/Payment-service ./Backend/Payment-service

WORKDIR /app/Backend/Payment-service

RUN direnv allow .

RUN go mod tidy && go mod download

RUN CGO_ENABLED=0 go build -v -o /payment-service ./cmd/api

FROM gcr.io/distroless/static-debian12

COPY --from=builder /payment-service /payment-service

EXPOSE 8083

CMD ["/payment-service"]
