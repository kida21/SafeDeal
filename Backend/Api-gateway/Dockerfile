FROM golang:latest AS builder

WORKDIR /app

COPY Backend/Api-gateway/go.mod ./Backend/Api-gateway/go.mod

COPY Backend/Api-gateway/go.sum ./Backend/Api-gateway/go.sum

COPY proto/auth ./Proto/auth

COPY Backend/Api-gateway ./Backend/Api-gateway

WORKDIR /app/Backend/Api-gateway

RUN CGO_ENABLED=0 go build -v -o /api-gateway ./cmd/api

FROM gcr.io/distroless/static-debian12

COPY --from=builder /api-gateway /api-gateway

EXPOSE 8080

CMD ["/api-gateway"]