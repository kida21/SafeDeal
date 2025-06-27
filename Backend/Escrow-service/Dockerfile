FROM golang:latest as builder

WORKDIR /app

# Install direnv (optional)
RUN apt-get update && \
    apt-get install --no-install-recommends -y direnv && \
    rm -rf /var/lib/apt/lists/*

# Module setup
COPY go.mod .
COPY go.sum .
RUN go mod download


COPY .envrc .
RUN direnv allow .


COPY . .

# Build escrow-service Go binary
RUN eval "$(direnv export bash)" && \
    CGO_ENABLED=0 go build -o /escrow-service ./cmd/api

# 🧊 Final image
FROM gcr.io/distroless/static-debian12

COPY --from=builder /escrow-service /escrow-service

EXPOSE 8082

CMD ["/escrow-service"]
