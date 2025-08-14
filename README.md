# SafeDeal - Blockchain-Powered Escrow System

![Golang](https://img.shields.io/badge/Golang-00ADD8?style=for-the-badge&logo=go&logoColor=white)
![Ethereum](https://img.shields.io/badge/Ethereum-3C3C3D?style=for-the-badge&logo=ethereum&logoColor=white)
![Chapa](https://img.shields.io/badge/Chapa-4CAF50?style=for-the-badge&logo=stripe&logoColor=white)
![Fiber](https://img.shields.io/badge/Fiber-007ACC?style=for-the-badge&logo=fastify&logoColor=white)
![RabbitMQ](https://img.shields.io/badge/RabbitMQ-FF6600?style=for-the-badge&logo=rabbitmq&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)
![Redis](https://img.shields.io/badge/Redis-DC382D?style=for-the-badge&logo=redis&logoColor=white)
![Consul](https://img.shields.io/badge/Consul-00A9E0?style=for-the-badge&logo=consul&logoColor=white)
![Ngrok](https://img.shields.io/badge/Ngrok-8A4FFF?style=for-the-badge&logo=ngrok&logoColor=white)

## Table of Contents
- [Description](#description)
- [Features](#features)
- [Architecture Overview](#architecture-overview)
- [Technology Stack](#technology-stack)
- [Getting Started](#getting-started)


## Description
SafeDeal is a hybrid escrow platform that combines the regulatory compliance of traditional payment systems with the transparency of blockchain technology. The system uses Chapa for Ethiopian Birr (ETB) transactions while leveraging Ethereum to maintain an immutable, auditable record of transaction states. This approach provides users with the familiarity of local payment methods and the security benefits of decentralized verification.

## Features
- **Hybrid Payment Model**: ETB transactions through Chapa with blockchain state logging
- **User Wallet Management**: Auto-generated Ethereum wallets with secure private key encryption
- **On-chain State Verification**: Immutable tracking of escrow status (AWAITING_PAYMENT → ACTIVE → CLOSED)
- **Event-Driven Architecture**: RabbitMQ for asynchronous communication between services
- **Secure Authentication**: JWT-based auth with session revocation and refresh token rotation
- **Multi-Service Architecture**: Microservices for user management, payments, escrow, and blockchain interaction
- **Webhook Integration**: Secure handling of Chapa payment confirmations
- **Consul Service Discovery**: Dynamic service registration and discovery
- **Dockerized Deployment**: Containerized services with Docker Compose

## Architecture Overview

SafeDeal implements a **hybrid escrow architecture** that strategically separates financial operations from state management:

### Core Design Principles
1. **Regulatory Compliance**: All ETB funds flow through Chapa's regulated payment system
2. **Blockchain Transparency**: Ethereum smart contracts maintain an immutable record of transaction states
3. **Decoupled Services**: Microservices communicate via gRPC and RabbitMQ
4. **User-Centric Design**: Wallet creation is opt-in, ensuring user consent

### Workflow
1. **Escrow Creation**: 
   - Buyer creates escrow through frontend
   - System creates off-chain record and logs on-chain state as `AWAITING_PAYMENT`

2. **Payment Processing**:
   - Buyer pays via Chapa (funds held in Chapa's system)
   - Chapa webhook triggers on-chain status update to `ACTIVE`

3. **Fund Release**:
   - Buyer confirms receipt
   - System initiates Chapa transfer to seller's bank
   - Transfer webhook triggers on-chain status update to `CLOSED`

### Key Components
- **API Gateway**: Single entry point that routes requests and handles authentication
- **User Service**: Manages user accounts, authentication, and wallet generation
- **Escrow Service**: Handles escrow lifecycle and business logic
- **Payment Service**: Integrates with Chapa and processes webhooks
- **Blockchain Adapter**: Bridges between backend services and Ethereum smart contract
- **RabbitMQ**: Event bus for asynchronous communication
- **PostgreSQL**: Persistent storage for off-chain data
- **Redis**: Session management and token revocation

The architecture ensures that sensitive financial operations remain within the regulated Chapa ecosystem while leveraging blockchain for trustless state verification and auditability.

## Technology Stack
- **Backend**: Golang
- **Framework**: Fiber (Golang)
- **Blockchain**: Ethereum (Sepolia Testnet)
- **Smart Contracts**: Solidity
- **Payment Gateway**: Chapa
- **Message Broker**: RabbitMQ
- **Database**: PostgreSQL
- **Cache**: Redis
- **Service Discovery**: HashiCorp Consul
- **Containerization**: Docker & Docker Compose
- **Authentication**: JWT with refresh tokens
- **gRPC**: Service-to-service communication
- **Web Framework**: Fiber (Golang)

## Getting Started
```bash
# Clone the repository
git clone https://github.com/yourusername/safedeal.git
cd safedeal

# Set up environment variables
cp .env.example .env
# Update .env with your configuration

# Start the services
docker-compose up --build

# Access the API
# API Gateway: http://localhost:8080
