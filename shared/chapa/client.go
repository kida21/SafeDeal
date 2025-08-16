package chapa

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
)

type Client struct {
	BaseURL    string
	APIKey     string
	SecretKey  string
	HttpClient *http.Client
}

func NewClient() *Client {
	return &Client{
		BaseURL:    "https://api.chapa.co/v1",
		APIKey:     os.Getenv("CHAPA_PUBLIC_KEY"),
        SecretKey:  os.Getenv("CHAPA_SECRET_KEY"),
		HttpClient: &http.Client{},
	}
}

type TransferRequest struct {
	AccountName     string `json:"account_name"`
	AccountNumber   string `json:"account_number"`
	Amount          string `json:"amount"`
	Currency        string `json:"currency"`
	Reference       string `json:"reference"`
	BankCode        int    `json:"bank_code"`
	CallbackURL     string `json:"callback_url,omitempty"`
	ReturnURL       string `json:"return_url,omitempty"`
}

type TransferResponse struct {
	Status  string `json:"status"`
	Message string `json:"message"`
	Data    struct {
		TransferID string `json:"transfer_id"`
		Status     string `json:"status"`
	} `json:"data"`
}

func (c *Client) TransferToSeller(
	sellerID uint,
	amount float64,
	reference string,
	accountName, accountNumber string,
	bankCode int,
) (*TransferResponse, error) {
	url := "https://api.chapa.co/v1/transfers"
	method := "POST"

	// ✅ Format amount as string
	amountStr := fmt.Sprintf("%.2f", amount)

	payload := TransferRequest{
		AccountName:   accountName,
		AccountNumber: accountNumber,
		Amount:        amountStr,
		Currency:      "ETB",
		Reference:     reference,
		BankCode:      bankCode,
		CallbackURL:   "https://evolved-bonefish-hardly.ngrok-free.app/webhook/transfer",
		ReturnURL:     "https://frontend.com/transfer/success",
	}

	reqBody, err := json.Marshal(payload)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal request: %v", err)
	}

	log.Printf("📤 Sending transfer request: %s", reqBody)

	req, err := http.NewRequest(method, url, bytes.NewBuffer(reqBody))
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %v", err)
	}

	req.Header.Set("Authorization", "Bearer "+c.SecretKey)
	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("request failed: %v", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read response body: %v", err)
	}

	log.Printf("📥 Chapa response (%d): %s", resp.StatusCode, string(body))

	if resp.StatusCode != http.StatusOK && resp.StatusCode != http.StatusCreated {
		return nil, fmt.Errorf("transfer failed with status %d: %s", resp.StatusCode, string(body))
	}

	var response TransferResponse
	if err := json.Unmarshal(body, &response); err != nil {
		return nil, fmt.Errorf("failed to decode response: %v", err)
	}

	if response.Status != "success" {
		return nil, fmt.Errorf("transfer failed: %s", response.Message)
	}

	return &response, nil
}