package mcp

import (
	"bufio"
	"encoding/json"
	"fmt"
	"io"
	"os"
)

// JSON-RPC message types.
type request struct {
	JSONRPC string          `json:"jsonrpc"`
	ID      any             `json:"id"`
	Method  string          `json:"method"`
	Params  json.RawMessage `json:"params,omitempty"`
}

type response struct {
	JSONRPC string `json:"jsonrpc"`
	ID      any    `json:"id"`
	Result  any    `json:"result,omitempty"`
	Error   *rpcErr `json:"error,omitempty"`
}

type rpcErr struct {
	Code    int    `json:"code"`
	Message string `json:"message"`
}

// Tool represents a registered MCP tool.
type Tool struct {
	Name        string       `json:"name"`
	Description string       `json:"description"`
	InputSchema inputSchema  `json:"inputSchema"`
	Handler     ToolHandler
}

type inputSchema struct {
	Type       string              `json:"type"`
	Properties map[string]Property `json:"properties,omitempty"`
	Required   []string            `json:"required,omitempty"`
}

type Property struct {
	Type        string `json:"type"`
	Description string `json:"description,omitempty"`
}

// ToolHandler is the function signature for tool execution.
type ToolHandler func(args map[string]any) (string, error)

// ToolResult is the content returned from a tool.
type toolResult struct {
	Content []contentItem `json:"content"`
	IsError bool          `json:"isError,omitempty"`
}

type contentItem struct {
	Type string `json:"type"`
	Text string `json:"text"`
}

// Server is a minimal MCP server over stdio.
type Server struct {
	name    string
	version string
	tools   []Tool
	reader  *bufio.Reader
	writer  io.Writer
}

// NewServer creates a new MCP server.
func NewServer(name, version string) *Server {
	return &Server{
		name:    name,
		version: version,
		reader:  bufio.NewReader(os.Stdin),
		writer:  os.Stdout,
	}
}

// AddTool registers a tool.
func (s *Server) AddTool(name, desc string, properties map[string]Property, required []string, handler ToolHandler) {
	s.tools = append(s.tools, Tool{
		Name:        name,
		Description: desc,
		InputSchema: inputSchema{
			Type:       "object",
			Properties: properties,
			Required:   required,
		},
		Handler: handler,
	})
}

// Serve starts the MCP server loop reading from stdin.
func (s *Server) Serve() error {
	for {
		line, err := s.reader.ReadString('\n')
		if err != nil {
			if err == io.EOF {
				return nil
			}
			return fmt.Errorf("read stdin: %w", err)
		}
		if line == "" || line == "\n" {
			continue
		}
		var req request
		if err := json.Unmarshal([]byte(line), &req); err != nil {
			continue
		}
		s.handleRequest(req)
	}
}

func (s *Server) handleRequest(req request) {
	switch req.Method {
	case "initialize":
		s.handleInitialize(req)
	case "tools/list":
		s.handleToolsList(req)
	case "tools/call":
		s.handleToolsCall(req)
	case "notifications/initialized":
		// no response needed
	default:
		s.sendError(req.ID, -32601, "method not found: "+req.Method)
	}
}

func (s *Server) handleInitialize(req request) {
	s.send(req.ID, map[string]any{
		"protocolVersion": "2024-11-05",
		"capabilities": map[string]any{
			"tools": map[string]any{},
		},
		"serverInfo": map[string]any{
			"name":    s.name,
			"version": s.version,
		},
	})
}

func (s *Server) handleToolsList(req request) {
	tools := make([]Tool, len(s.tools))
	copy(tools, s.tools)
	// Clear handlers before serializing
	for i := range tools {
		tools[i].Handler = nil
	}
	s.send(req.ID, map[string]any{"tools": tools})
}

func (s *Server) handleToolsCall(req request) {
	var params struct {
		Name      string         `json:"name"`
		Arguments map[string]any `json:"arguments"`
	}
	if err := json.Unmarshal(req.Params, &params); err != nil {
		s.sendError(req.ID, -32602, "invalid params")
		return
	}
	for _, t := range s.tools {
		if t.Name == params.Name {
			text, err := t.Handler(params.Arguments)
			if err != nil {
				s.send(req.ID, toolResult{
					Content: []contentItem{{Type: "text", Text: err.Error()}},
					IsError: true,
				})
				return
			}
			s.send(req.ID, toolResult{
				Content: []contentItem{{Type: "text", Text: text}},
			})
			return
		}
	}
	s.sendError(req.ID, -32602, "unknown tool: "+params.Name)
}

func (s *Server) send(id any, result any) {
	resp := response{
		JSONRPC: "2.0",
		ID:      id,
		Result:  result,
	}
	data, _ := json.Marshal(resp)
	fmt.Fprintf(s.writer, "%s\n", data)
}

func (s *Server) sendError(id any, code int, msg string) {
	resp := response{
		JSONRPC: "2.0",
		ID:      id,
		Error:   &rpcErr{Code: code, Message: msg},
	}
	data, _ := json.Marshal(resp)
	fmt.Fprintf(s.writer, "%s\n", data)
}
