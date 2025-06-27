FROM golang:latest as builder

WORKDIR /go/src/SafeDeal/proto

COPY auth/ auth/


RUN apt-get update && \
    apt-get install -y unzip && \
    rm -rf /var/lib/apt/lists/*

RUN go install google.golang.org/protobuf/cmd/protoc-gen-go@latest && \
    go install google.golang.org/grpc/cmd/protoc-gen-go-grpc@latest


RUN protoc --go_out=. --go-grpc_out=. auth/v1/auth.proto