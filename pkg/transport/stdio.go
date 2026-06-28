package transport

import (
	"github.com/Fromsko/siyuan-mcp-server-go/pkg/tools"
	"github.com/mark3labs/mcp-go/server"
)

type stdioServer struct{}

func (s *stdioServer) Serve(registry *tools.Registry, name, version string) error {
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

	return server.ServeStdio(mcpServer)
}

var _ Server = (*stdioServer)(nil)
