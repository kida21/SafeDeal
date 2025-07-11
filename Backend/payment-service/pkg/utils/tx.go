package utils

import (
	"crypto/rand"
	"fmt"

	"encoding/hex"
)

func GenerateTxRef() string {
    b := make([]byte, 16)
    rand.Read(b)
    return fmt.Sprintf("TX-%s",hex.EncodeToString(b))
}
