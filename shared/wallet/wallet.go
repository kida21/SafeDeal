package wallet

import (
    "crypto/ecdsa"
    "crypto/rand"

    "github.com/ethereum/go-ethereum/crypto"
)

type Wallet struct {
    PrivateKey []byte
    Address    string
}

func GenerateWallet() (*Wallet, error) {
    privateKey, err := ecdsa.GenerateKey(crypto.S256(), rand.Reader)
    if err != nil {
        return nil, err
    }

    address := crypto.PubkeyToAddress(privateKey.PublicKey).Hex()
    privateKeyBytes := crypto.FromECDSA(privateKey)

    return &Wallet{
        PrivateKey: privateKeyBytes,
        Address:    address,
    }, nil
}