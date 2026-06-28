package client

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"time"
)

// SiYuanResponse represents the standard SiYuan API response.
type SiYuanResponse struct {
	Code int             `json:"code"`
	Msg  string          `json:"msg"`
	Data json.RawMessage `json:"data"`
}

// Client is an HTTP client for the SiYuan API.
type Client struct {
	baseURL    string
	token      string
	httpClient *http.Client
}

// NewClient creates a new SiYuan API client.
// Token is read from SIYUAN_TOKEN, SIYUAN_API_TOKEN, or SIYUAN_AUTH_TOKEN env vars.
// Base URL defaults to http://localhost:6806, overridable via SIYUAN_API_URL.
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
		baseURL: baseURL,
		token:   token,
		httpClient: &http.Client{
			Timeout: 10 * time.Second,
		},
	}
}

// Post sends a POST request to the given SiYuan API endpoint.
func (c *Client) Post(endpoint string, body any) (*SiYuanResponse, error) {
	jsonBody, err := json.Marshal(body)
	if err != nil {
		return nil, fmt.Errorf("marshal request: %w", err)
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
		return nil, fmt.Errorf("request failed: %w", err)
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("read response: %w", err)
	}

	var result SiYuanResponse
	if err := json.Unmarshal(respBody, &result); err != nil {
		return nil, fmt.Errorf("unmarshal response (status %d): %w\nbody: %s", resp.StatusCode, err, string(respBody))
	}

	if result.Code != 0 {
		return &result, fmt.Errorf("siyuan API error (code=%d): %s", result.Code, result.Msg)
	}

	return &result, nil
}

// HasToken returns whether a token is configured.
func (c *Client) HasToken() bool {
	return c.token != ""
}

// BaseURL returns the configured base URL.
func (c *Client) BaseURL() string {
	return c.baseURL
}
