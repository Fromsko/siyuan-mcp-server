package transport

import (
	"github.com/Fromsko/siyuan-mcp-server-go/pkg/tools"
	"github.com/mark3labs/mcp-go/server"
)

// stdioServer serves MCP over standard input/output.
// Compatible with Claude Desktop, Cursor, VS Code, and any
// MCP client that communicates over stdio.
type stdioServer struct{}

func (s *stdioServer) Serve(registry *tools.Registry, name, version string) error {
	mcpServer := server.NewMCPServer(name, version,
		server.WithToolCapabilities(true),
		server.WithLogging(),
	)

	// Register all 37 SiYuan API tools.
	for _, t := range registry.List() {
		tool := t
		regTool := registry.Get(tool.Name)
		if regTool == nil {
			continue
		}
		mcpServer.AddTool(tool, regTool.Handler)
	}

	// Register the auto-generated help tool.
	helpTool := registry.HelpTool()
	mcpServer.AddTool(helpTool.Tool, helpTool.Handler)

	return server.ServeStdio(mcpServer)
}

var _ Server = (*stdioServer)(nil)
