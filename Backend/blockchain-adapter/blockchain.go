package blockchain

import (
	"SafeDeal/contracts"
	"context"
	"fmt"
	"log"

	"math/big"
	"os"
	"strconv"
	"strings"

	"github.com/ethereum/go-ethereum/accounts/abi/bind"
	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/core/types"
	"github.com/ethereum/go-ethereum/crypto"
	"github.com/ethereum/go-ethereum/ethclient"
)

type Client struct {
    Contract *contracts.Contracts
    Client   *ethclient.Client
    Auth     *bind.TransactOpts
}

func NewClient() (*Client, error) {
	url := os.Getenv("ETHEREUM_NODE_URL")
	if url == "" {
        log.Print("empty ETHEREUM_NODE_URL")
		return nil, fmt.Errorf("ETHEREUM_NODE_URL is not set")
	}
   
	privateKeyStr := os.Getenv("PRIVATE_KEY")
	if privateKeyStr == "" {
        log.Print("empty PRIVATE_KEY")
		return nil, fmt.Errorf("PRIVATE_KEY is not set")
	}

	chainIDStr := os.Getenv("CHAIN_ID")
	if chainIDStr == "" {
        log.Print("empty CHAIN_ID")
		return nil, fmt.Errorf("CHAIN_ID is not set")
	}
	chainID, err := strconv.ParseInt(chainIDStr, 10, 64)
	if err != nil {
		return nil, fmt.Errorf("invalid CHAIN_ID: %v", err)
	}

	contractAddressStr := os.Getenv("CONTRACT_ADDRESS")
	if contractAddressStr == "" {
        log.Print("empty CONTRACT_ADDRESS")
		return nil, fmt.Errorf("CONTRACT_ADDRESS is not set")
	}
	contractAddress := common.HexToAddress(contractAddressStr)

	client, err := ethclient.Dial(url)
	if err != nil {
		return nil, fmt.Errorf("failed to connect to Ethereum: %v", err)
	}

	
	_, err = client.ChainID(context.Background())
	if err != nil {
		return nil, fmt.Errorf("failed to reach Ethereum network: %v", err)
	}

	
	privateKey, err := crypto.HexToECDSA(strings.TrimPrefix(privateKeyStr, "0x"))
	if err != nil {
		return nil, fmt.Errorf("invalid private key: %v", err)
	}

	
	auth, err := bind.NewKeyedTransactorWithChainID(privateKey, big.NewInt(chainID))
	if err != nil {
		return nil, fmt.Errorf("failed to create transactor: %v", err)
	}

	
	contract, err := contracts.NewContracts(contractAddress, client)
	if err != nil {
		return nil, fmt.Errorf("failed to load contract at %s: %v", contractAddressStr, err)
	}

	
	_, err = contract.NextId(&bind.CallOpts{Context: context.Background()})
	if err != nil {
		return nil, fmt.Errorf("contract not responding (wrong address or network): %v", err)
	}

     if contract == nil {
		return nil, fmt.Errorf("contract is nil after NewContracts")
	}

	return &Client{
		Contract: contract,
		Auth:     auth,
		Client:   client,
	}, nil
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