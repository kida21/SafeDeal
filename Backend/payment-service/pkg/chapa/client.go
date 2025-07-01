// pkg/chapa/client.go
package chapa

import (
    "bytes"
    "context"
    "encoding/json"
    "fmt"
    "io"
    "net/http"
)

const CHAPA_API_URL = "https://api.chapa.co/v1/transaction/initialize "

type ChapaClient struct {
    secretKey string
}

func NewChapaClient(secret string) *ChapaClient {
    return &ChapaClient{secretKey: secret}
}

type ChapaRequest struct {
    Amount      float64 `json:"amount"`
    Currency    string `json:"currency"`
    Email       string `json:"email"`
    FirstName   string `json:"first_name"`
    LastName    string `json:"last_name"`
    CallbackURL string `json:"callback_url"`
    ReturnURL   string `json:"return_url"`
    TxRef       string `json:"tx_ref"`
}

type ChapaResponse struct {
    Data struct {
        CheckOutURL string `json:"checkout_url"`
    } `json:"data"`
    Message string `json:"message"`
}

func (c *ChapaClient) InitiatePayment(req ChapaRequest) (string, string, error) {
    body, _ := json.Marshal(req)
    client := &http.Client{}
    request, _ := http.NewRequestWithContext(context.Background(), "POST", CHAPA_API_URL, bytes.NewBuffer(body))

    request.Header.Set("Authorization", "Bearer "+c.secretKey)
    request.Header.Set("Content-Type", "application/json")

    resp, err := client.Do(request)
    if err != nil {
        return "", "", err
    }
    defer resp.Body.Close()

    data, _ := io.ReadAll(resp.Body)

    var chapaResp ChapaResponse
    json.Unmarshal(data, &chapaResp)

    if chapaResp.Message != "success" {
        return "", "", fmt.Errorf("payment failed: %s", chapaResp.Message)
    }

    txRef := req.TxRef
    return chapaResp.Data.CheckOutURL, txRef, nil
}