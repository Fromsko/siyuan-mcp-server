package transport

import "github.com/Fromsko/siyuan-mcp-server-go/pkg/tools"

// Server abstracts MCP server startup for different transports.
type Server interface {
	Serve(registry *tools.Registry, name, version string) error
}

// NewStdio returns a stdio transport server.
func NewStdio() Server { return &stdioServer{} }

// NewHTTP returns an HTTP transport server on the given address.
func NewHTTP(addr string) Server { return &httpServer{addr: addr} }
