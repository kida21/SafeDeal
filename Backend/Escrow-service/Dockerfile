FROM golang:latest

WORKDIR /app

COPY go.mod .

COPY go.sum .

RUN go mod download


COPY ../proto /go/src/SafeDeal/proto


COPY . .


RUN CGO_ENABLED=0 go build -o /escrow-service main.go

# Final image
FROM gcr.io/distroless/static-debian12

COPY --from=builder /escrow-service /escrow-service

EXPOSE 8082

CMD ["/escrow-service"]