package transport

import (
	"log"

	"github.com/Fromsko/siyuan-mcp-server-go/pkg/tools"
	"github.com/mark3labs/mcp-go/server"
)

// httpServer serves MCP over HTTP (Streamable HTTP transport).
// Suitable for remote deployment, Vercel, Cloudflare Workers, etc.
// The MCP endpoint is served at {addr}/mcp.
type httpServer struct{ addr string }

func (h *httpServer) Serve(registry *tools.Registry, name, version string) error {
	mcpServer := server.NewMCPServer(name, version,
		server.WithToolCapabilities(true),
		server.WithLogging(),
	)

	for _, t := range registry.List() {
		tool := t
		regTool := registry.Get(tool.Name)
		if regTool == nil {
			continue
		}
		mcpServer.AddTool(tool, regTool.Handler)
	}

	helpTool := registry.HelpTool()
	mcpServer.AddTool(helpTool.Tool, helpTool.Handler)

	httpSrv := server.NewStreamableHTTPServer(mcpServer)
	log.Printf("HTTP MCP server listening on %s/mcp", h.addr)
	return httpSrv.Start(h.addr)
}

var _ Server = (*httpServer)(nil)
