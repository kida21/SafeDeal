FROM golang:latest as builder

WORKDIR /app


RUN apt-get update && \
    apt-get install --no-install-recommends -y direnv && \
    rm -rf /var/lib/apt/lists/*


COPY go.mod ./

COPY go.sum ./

RUN go mod download

COPY .envrc ./

RUN direnv allow .

COPY ../proto /go/src/SafeDeal/proto

COPY . .

RUN eval "$(direnv export bash)" && \
    CGO_ENABLED=0 go build -o /escrow-service main.go

FROM gcr.io/distroless/static-debian12

COPY --from=builder /escrow-service /escrow-service

EXPOSE 8082

CMD ["/escrow-service"]
