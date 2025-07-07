package chapa

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
)

const CHAPA_API_URL = "https://api.chapa.co/v1/transaction/initialize"

type ChapaClient struct {
    secretKey string
}

func NewChapaClient(secret string) *ChapaClient {
    return &ChapaClient{secretKey: secret}
}

type ChapaRequest struct {
    Amount            string `json:"amount"`
    Currency          string `json:"currency"`
    Email             string `json:"email"`
    FirstName         string `json:"first_name,omitempty"`
    LastName          string `json:"last_name,omitempty"`
    PhoneNumber       string `json:"phone_number,omitempty"` 
    TxRef             string `json:"tx_ref"`
    CallbackURL       string `json:"callback_url"`
    ReturnURL         string `json:"return_url"`
    CustomTitle       string `json:"customization[title]"`     
    CustomDescription string `json:"customization[description]"` 
    HideReceipt       string `json:"meta[hide_receipt]"`
}

type ChapaResponse struct {
    Data struct {
        CheckOutURL string `json:"checkout_url"`
    } `json:"data"`
    Message string `json:"message"`
}

func (c *ChapaClient) InitiatePayment(req ChapaRequest) (string, string, error) {
    body, _ := json.Marshal(req)
    reqHTTP, err := http.NewRequest("POST", CHAPA_API_URL, bytes.NewBuffer(body))
    if err != nil {
        return "", "", fmt.Errorf("failed to create request: %v", err)
    }

    reqHTTP.Header.Set("Authorization", "Bearer "+c.secretKey)
    reqHTTP.Header.Set("Content-Type", "application/json")

    client := &http.Client{}
    resp, err := client.Do(reqHTTP)
    if err != nil {
        return "", "", fmt.Errorf("request failed: %v", err)
    }
    defer resp.Body.Close()

    bodyBytes, err := io.ReadAll(resp.Body)
    if err != nil {
        return "", "", fmt.Errorf("failed to read response body: %v", err)
    }

   var result map[string]interface{}
    if err := json.Unmarshal(bodyBytes, &result); err != nil {
        return "", "", fmt.Errorf("failed to decode response: %v", err)
    }

    status, ok := result["status"].(string)
    if !ok || status != "success" {
        message, _ := result["message"].(string)
        return "", "", fmt.Errorf("chapa returned error: %s", message)
    }

    dataRaw, ok := result["data"]
    if !ok || dataRaw == nil {
        return "", "", fmt.Errorf("missing 'data' in Chapa response")
    }

    dataMap, ok := dataRaw.(map[string]interface{})
    if !ok {
        return "", "", fmt.Errorf("'data' is not a valid object")
    }

    paymentURLRaw, ok := dataMap["checkout_url"]
    if !ok || paymentURLRaw == nil {
        return "", "", fmt.Errorf("missing 'checkout_url'")
    }

    paymentURL, ok := paymentURLRaw.(string)
    if !ok {
        return "", "", fmt.Errorf("'checkout_url' is not a string")
    }

    txRefRaw, ok := dataMap["tx_ref"]
    if !ok || txRefRaw == nil {
        return paymentURL, "", nil 
    }

    txRef, ok := txRefRaw.(string)
    if !ok {
        return paymentURL, "", nil
    }

    return paymentURL, txRef, nil
}
