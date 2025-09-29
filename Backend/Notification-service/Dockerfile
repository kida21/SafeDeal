FROM golang:1.25-alpine3.22 AS builder

WORKDIR /app

COPY Backend/Notification-service/go.mod ./Backend/Notification-service/go.mod

COPY Backend/Notification-service/go.sum ./Backend/Notification-service/go.sum

COPY proto/escrow ./Proto/escrow

COPY message-broker ./message-broker

COPY Backend/Notification-service ./Backend/Notification-service

WORKDIR /app/Backend/Notification-service

RUN go mod tidy && go mod download

RUN CGO_ENABLED=0 go build -v -o /notification-service ./cmd/api

FROM gcr.io/distroless/static-debian12

COPY --from=builder /notification-service /notification-service

EXPOSE 8086

CMD ["/notification-service"]