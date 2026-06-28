// Package siyuan provides a minimal HTTP client for the SiYuan note-taking API.
//
// SiYuan exposes a REST API at http://localhost:6806 by default (configurable
// via SIYUAN_API_URL). Authentication uses token-based auth via the
// SIYUAN_TOKEN environment variable.
//
// Official API docs: https://github.com/siyuan-note/siyuan/blob/master/API_zh_CN.md
//
// Usage:
//
//	c := siyuan.NewClient()
//	data, err := c.Call("/api/system/version", map[string]any{})
//	if err != nil {
//	    log.Fatal(err)
//	}
//	fmt.Println(string(data))
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

// Response is the standard SiYuan API response envelope.
// Every SiYuan endpoint returns { code, msg, data }.
type Response struct {
	Code int             `json:"code"` // 0 = success, non-zero = error
	Msg  string          `json:"msg"`  // error message when code != 0
	Data json.RawMessage `json:"data"` // payload, varies by endpoint
}

// Client is an HTTP client for the SiYuan API.
// It reads configuration from environment variables:
//
//	SIYUAN_TOKEN        — API token (required, from 设置 → 关于)
//	SIYUAN_API_TOKEN    — fallback token name
//	SIYUAN_AUTH_TOKEN   — fallback token name
//	SIYUAN_API_URL      — base URL (default: http://localhost:6806)
type Client struct {
	baseURL    string
	token      string
	httpClient *http.Client
}

// NewClient creates a SiYuan API client from environment variables.
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

// Call invokes a SiYuan API endpoint and returns the data portion of the response.
//
// The body parameter is JSON-marshaled and sent as the request body.
// Returns the data field on success, or an error if the API returns code != 0
// or if the HTTP request fails.
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
