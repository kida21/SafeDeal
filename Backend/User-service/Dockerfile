FROM golang:latest

RUN apt-get update && \
    apt-get install -y direnv && \
    apt-get clean

WORKDIR /app

COPY go.mod ./

COPY go.sum ./

COPY .envrc ./

RUN go mod download

COPY . .

RUN direnv allow .

RUN go build -o /api cmd/api/main.go

EXPOSE 8081

CMD ["/api"]