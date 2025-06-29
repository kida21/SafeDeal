FROM golang:latest as builder

WORKDIR /app

RUN apt-get update && \
    apt-get install --no-install-recommends -y direnv && \
    rm -rf /var/lib/apt/lists/*

COPY go.mod .

COPY go.sum .

COPY .envrc .

RUN direnv allow .

RUN eval "$(direnv export bash)" && \
    go mod download

COPY ../.. /go/src/SafeDeal

COPY . .

RUN eval "$(direnv export bash)" && \
    CGO_ENABLED=0 go build -o /escrow-service ./cmd/api

FROM gcr.io/distroless/static-debian12

COPY --from=builder /escrow-service /escrow-service

EXPOSE 8082

CMD ["/escrow-service"]