package main

import (
	"context"
	"fmt"
	"log"
	"math/big"
	"os"
	"strconv"
    "contracts"
    "github.com/joho/godotenv"
	"github.com/ethereum/go-ethereum/accounts/abi/bind"
	"github.com/ethereum/go-ethereum/crypto"
	"github.com/ethereum/go-ethereum/ethclient"
)

func main() {
    if err := godotenv.Load(); err != nil {
        log.Printf("Warning: error loading .env file: %v", err)
    }
    nodeURL := os.Getenv("ETHEREUM_NODE_URL")
    privateKeyStr := os.Getenv("PRIVATE_KEY")
    chainIDStr := os.Getenv("CHAIN_ID")

    if nodeURL == "" || privateKeyStr == "" || chainIDStr == "" {
        log.Fatal("Missing required environment variables: ETHEREUM_NODE_URL, PRIVATE_KEY, CHAIN_ID")
    }

    
    chainID, err := strconv.ParseInt(chainIDStr, 10, 64)
    if err != nil {
        log.Fatalf("Invalid CHAIN_ID: %v", err)
    }

    // Connect to Ethereum
    client, err := ethclient.Dial(nodeURL)
    if err != nil {
        log.Fatalf("Failed to connect to Ethereum client: %v", err)
    }
    defer client.Close()

    // Load private key
    privateKey, err := crypto.HexToECDSA(privateKeyStr)
    if err != nil {
        log.Fatalf("Invalid private key: %v", err)
    }

    // Create transactor
    auth, err := bind.NewKeyedTransactorWithChainID(privateKey, big.NewInt(chainID))
    if err != nil {
        log.Fatalf("Failed to create authorized transactor: %v", err)
    }

    // Deploy contract
    address, tx, _, err := contracts.DeployContracts(auth, client)
    if err != nil {
        log.Fatalf("Failed to deploy contract: %v", err)
    }

    fmt.Printf("Deploying contract...\n")
    fmt.Printf("Transaction Hash: %s\n", tx.Hash().Hex())

    
    receipt, err := bind.WaitMined(context.Background(), client, tx)
    if err != nil {
        log.Fatalf("Failed to mine deployment transaction: %v", err)
    }

    fmt.Printf("Contract deployed successfully!\n")
    fmt.Printf("Contract Address: %s\n", address.Hex())
    fmt.Printf("Block Number: %v\n", receipt.BlockNumber)
}