package chapa

import (
	"bytes"
	"encoding/json"
	"fmt"
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
	Amount         float64 `json:"amount"`
	Currency       string  `json:"currency"`
	Recipient      string  `json:"recipient"` // seller bank code
	Reference      string  `json:"reference"`
	CallbackURL    string  `json:"callback_url,omitempty"`
	ReturnURL      string  `json:"return_url,omitempty"`
	FirstName      string  `json:"first_name,omitempty"`
	LastName       string  `json:"last_name,omitempty"`
	Email          string  `json:"email"`
}

type TransferResponse struct {
	Status  string `json:"status"`
	Message string `json:"message"`
	Data    struct {
		TransferID string `json:"transfer_id"`
		Status     string `json:"status"`
	} `json:"data"`
}

func (c *Client) TransferToSeller(sellerID uint, amount float64, reference, email string) (*TransferResponse, error) {
	url := c.BaseURL + "/transfer"

	payload := TransferRequest{
		Amount:      amount,
		Currency:    "ETB",
		Recipient:   fmt.Sprintf("seller-%d", sellerID),
		Reference:   reference,
		Email:       email,
		CallbackURL: os.Getenv("CHAPA_TRANSFER_WEBHOOK_URL"),
		ReturnURL:   "",
	}

	reqBody, err := json.Marshal(payload)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal request: %v", err)
	}

	req, err := http.NewRequest("POST", url, bytes.NewBuffer(reqBody))
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %v", err)
	}

	req.Header.Set("Authorization", "Bearer "+c.SecretKey)
	req.Header.Set("Content-Type", "application/json")

	resp, err := c.HttpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("request failed: %v", err)
	}
	defer resp.Body.Close()

	var response TransferResponse
	if err := json.NewDecoder(resp.Body).Decode(&response); err != nil {
		return nil, fmt.Errorf("failed to decode response: %v", err)
	}

	if response.Status != "success" {
		return nil, fmt.Errorf("transfer failed: %s", response.Message)
	}

	return &response, nil
}