package crypto

import (
	"crypto/aes"
	"crypto/cipher"
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"io"
)


func Encrypt(plaintext []byte, key string) (string, error) {
    block, err := aes.NewCipher([]byte(createHash(key)))
    if err != nil {
        return "", err
    }

    gcm, err := cipher.NewGCM(block)
    if err != nil {
        return "", err
    }

    
    nonce := make([]byte, gcm.NonceSize())
    if _, err := io.ReadFull(rand.Reader, nonce); err != nil {
        return "", err
    }
    ciphertext := gcm.Seal(nonce, nonce, plaintext, nil)
    return hex.EncodeToString(ciphertext), nil
}


func Decrypt(ciphertextHex string, key string) ([]byte, error) {
     ciphertext, err := hex.DecodeString(ciphertextHex)
    if err != nil {
        return nil, err
    }

    block, err := aes.NewCipher([]byte(createHash(key)))
    if err != nil {
        return nil, err
    }

    gcm, err := cipher.NewGCM(block)
    if err != nil {
        return nil, err
    }

    nonceSize := gcm.NonceSize()
    if len(ciphertext) < nonceSize {
        return nil, err
    }

    
    nonce, ciphertextBody := ciphertext[:nonceSize], ciphertext[nonceSize:]
    plaintext, err := gcm.Open(nil, nonce, ciphertextBody, nil)
    if err != nil {
        return nil, err
    }

    return plaintext, nil
}


func createHash(key string) string {
    h := sha256.New()
    h.Write([]byte(key))
    return hex.EncodeToString(h.Sum(nil))[:32] 
}