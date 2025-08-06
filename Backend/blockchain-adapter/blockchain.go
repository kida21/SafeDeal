package blockchain

import (
	"log"
	"math/big"
	"os"
	"strconv"
    "SafeDeal/contracts"
    "github.com/ethereum/go-ethereum/accounts/abi/bind"
	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/core/types"
	"github.com/ethereum/go-ethereum/crypto"
	"github.com/ethereum/go-ethereum/ethclient"
	"github.com/joho/godotenv"
)

type Client struct {
    Contract *contracts.Contracts
    Client   *ethclient.Client
    Auth     *bind.TransactOpts
}

func NewClient() *Client {
     if err := godotenv.Load(); err != nil {
        log.Printf("Warning: error loading .env file: %v", err)
    }

    url := os.Getenv("ETHEREUM_NODE_URL")
    privateKeyStr := os.Getenv("PRIVATE_KEY")
    chainID, _ := strconv.ParseInt(os.Getenv("CHAIN_ID"), 10, 64)

    client, err := ethclient.Dial(url)
    if err != nil {
        log.Fatalf("Failed to connect to Ethereum: %v", err)
    }

    privateKey, err := crypto.HexToECDSA(privateKeyStr)
    if err != nil {
        log.Fatalf("Invalid private key: %v", err)
    }

    auth, err := bind.NewKeyedTransactorWithChainID(privateKey, big.NewInt(chainID))
    if err != nil {
        log.Fatalf("Failed to create transactor: %v", err)
    }

    contractAddress := common.HexToAddress(os.Getenv("CONTRACT_ADDRESS"))
    contract, err := contracts.NewContracts(contractAddress, client)
    if err != nil {
        log.Fatalf("Failed to load contract: %v", err)
    }

    return &Client{
        Contract: contract,
        Client:   client,
        Auth:     auth,
    }
}

func (c *Client) CreateEscrow(buyer, seller common.Address, amount *big.Int) (*types.Transaction, error) {
    return c.Contract.CreateEscrow(c.Auth, buyer, seller, amount)
}

func (c *Client) ConfirmPayment(id *big.Int) (*types.Transaction, error) {
    return c.Contract.ConfirmPayment(c.Auth, id)
}

func (c *Client) FinalizeEscrow(id *big.Int) (*types.Transaction, error) {
    return c.Contract.FinalizeEscrow(c.Auth, id)
}

func (c *Client) GetEscrow(id *big.Int) (contracts.EscrowRecord, error) {
    return c.Contract.GetEscrow(nil, id)
}