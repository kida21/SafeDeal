FROM golang:latest AS builder

WORKDIR /app

COPY Backend/Chat-service/go.mod ./Backend/Chat-service/go.mod

COPY Backend/Chat-service/go.sum ./Backend/Chat-service/go.sum


COPY proto/escrow ./Proto/escrow

COPY Backend/Chat-service ./Backend/Chat-service

WORKDIR /app/Backend/Chat-service

RUN go mod tidy && go mod download

RUN CGO_ENABLED=0 go build -v -o /chat-service ./cmd/api

FROM gcr.io/distroless/static-debian12

COPY --from=builder /chat-service /chat-service

EXPOSE 8085

CMD ["/chat-service"]