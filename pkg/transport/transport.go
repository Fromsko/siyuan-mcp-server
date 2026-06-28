// Package transport provides pluggable MCP transport implementations.
//
// The Server interface abstracts the transport layer from the tool registry,
// enabling the same tools to be served over stdio (Claude Desktop, Cursor),
// HTTP (remote deployment), or future transports like SSE without code changes.
//
// Usage:
//
//	// Stdio (Claude Desktop / Cursor)
//	srv := transport.NewStdio()
//	srv.Serve(registry, name, version)
//
//	// HTTP (remote / serverless)
//	srv := transport.NewHTTP(":8080")
//	srv.Serve(registry, name, version)
//
// Adding a new transport requires only a struct that implements Server.
package transport

import "github.com/Fromsko/siyuan-mcp-server-go/pkg/tools"

// Server is the interface for starting an MCP server with a given transport.
type Server interface {
	// Serve starts the MCP server and blocks until shutdown.
	// The registry provides tool definitions and handlers.
	// Name and version are reported in the initialize response.
	Serve(registry *tools.Registry, name, version string) error
}

// NewStdio returns a stdio transport server backed by mcp-go.
func NewStdio() Server { return &stdioServer{} }

// NewHTTP returns an HTTP (Streamable HTTP) transport server on the given address.
func NewHTTP(addr string) Server { return &httpServer{addr: addr} }
