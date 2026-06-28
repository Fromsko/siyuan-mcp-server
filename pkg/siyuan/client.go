package siyuan

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"time"
)

// Response is the standard SiYuan API response.
type Response struct {
	Code int             `json:"code"`
	Msg  string          `json:"msg"`
	Data json.RawMessage `json:"data"`
}

// Client is a minimal HTTP client for SiYuan API.
type Client struct {
	baseURL    string
	token      string
	httpClient *http.Client
}

// NewClient creates a SiYuan API client.
func NewClient() *Client {
	token := os.Getenv("SIYUAN_TOKEN")
	if token == "" {
		token = os.Getenv("SIYUAN_API_TOKEN")
	}
	if token == "" {
		token = os.Getenv("SIYUAN_AUTH_TOKEN")
	}
	baseURL := os.Getenv("SIYUAN_API_URL")
	if baseURL == "" {
		baseURL = "http://localhost:6806"
	}
	return &Client{
		baseURL:    baseURL,
		token:      token,
		httpClient: &http.Client{Timeout: 10 * time.Second},
	}
}

// HasToken reports whether an API token is configured.
func (c *Client) HasToken() bool { return c.token != "" }

// BaseURL returns the configured base URL.
func (c *Client) BaseURL() string { return c.baseURL }

// Call invokes a SiYuan API endpoint and returns the data field.
func (c *Client) Call(endpoint string, body any) (json.RawMessage, error) {
	jsonBody, err := json.Marshal(body)
	if err != nil {
		return nil, fmt.Errorf("marshal: %w", err)
	}
	req, err := http.NewRequest("POST", c.baseURL+endpoint, bytes.NewReader(jsonBody))
	if err != nil {
		return nil, fmt.Errorf("create request: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")
	if c.token != "" {
		req.Header.Set("Authorization", "Token "+c.token)
	}
	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("request: %w", err)
	}
	defer resp.Body.Close()
	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("read: %w", err)
	}
	var result Response
	if err := json.Unmarshal(respBody, &result); err != nil {
		return nil, fmt.Errorf("unmarshal (status %d): %w", resp.StatusCode, err)
	}
	if result.Code != 0 {
		return result.Data, fmt.Errorf("siyuan code=%d: %s", result.Code, result.Msg)
	}
	return result.Data, nil
}
