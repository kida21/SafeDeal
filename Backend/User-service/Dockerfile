FROM golang:latest AS builder

WORKDIR /app

COPY Backend/User-service/go.mod ./Backend/User-service/go.mod

COPY Backend/User-service/go.sum ./Backend/User-service/go.sum

COPY proto/auth ./Proto/auth

COPY shared  ./shared

COPY Backend/User-service ./Backend/User-service

WORKDIR /app/Backend/User-service

RUN go mod tidy && go mod download

RUN CGO_ENABLED=0 go build -v -o /user-service ./cmd/api

FROM gcr.io/distroless/static-debian12

COPY --from=builder /user-service /user-service

EXPOSE 8081

CMD ["/user-service"]
