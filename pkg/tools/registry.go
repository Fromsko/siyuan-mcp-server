package tools

import (
	"context"
	"fmt"
	"strings"

	"github.com/Fromsko/siyuan-mcp-server-go/pkg/siyuan"
	"github.com/mark3labs/mcp-go/mcp"
)

// Tool wraps a named MCP tool with its handler.
type Tool struct {
	mcp.Tool
	Handler func(ctx context.Context, req mcp.CallToolRequest) (*mcp.CallToolResult, error)
}

// Registry manages tool registration and auto-generates help.
type Registry struct {
	tools  []Tool
	client *siyuan.Client
}

// New creates a tool registry tied to a SiYuan client.
func New(client *siyuan.Client) *Registry {
	return &Registry{client: client}
}

// Register adds a tool from a declarative spec.
func (r *Registry) Register(name, desc string, opts []mcp.ToolOption, handler func(ctx context.Context, req mcp.CallToolRequest) (*mcp.CallToolResult, error)) {
	t := mcp.NewTool(name, append([]mcp.ToolOption{mcp.WithDescription(desc)}, opts...)...)
	r.tools = append(r.tools, Tool{Tool: t, Handler: handler})
}

// List returns all registered tools with their handlers nil'd for serialization.
func (r *Registry) List() []mcp.Tool {
	result := make([]mcp.Tool, len(r.tools))
	for i, t := range r.tools {
		result[i] = t.Tool
	}
	return result
}

// Get returns a tool by name, or nil.
func (r *Registry) Get(name string) *Tool {
	for i := range r.tools {
		if r.tools[i].Name == name {
			return &r.tools[i]
		}
	}
	return nil
}

// HelpTool returns a built-in tool that lists all available tools.
func (r *Registry) HelpTool() Tool {
	return Tool{
		Tool: mcp.NewTool("help",
			mcp.WithDescription("列出所有可用工具或获取指定工具的详细信息"),
			mcp.WithString("tool",
				mcp.Description("要获取详情的工具名称（可选，不提供则列出所有工具）"),
			),
		),
		Handler: func(ctx context.Context, req mcp.CallToolRequest) (*mcp.CallToolResult, error) {
			name := req.GetString("tool", "")
			if name != "" {
				t := r.Get(name)
				if t == nil {
					return mcp.NewToolResultError(fmt.Sprintf("工具 %q 不存在", name)), nil
				}
				return mcp.NewToolResultText(formatToolDetail(t)), nil
			}
			return mcp.NewToolResultText(r.formatAllTools()), nil
		},
	}
}

func (r *Registry) formatAllTools() string {
	var b strings.Builder
	b.WriteString(fmt.Sprintf("# 可用工具 (%d)\n\n", len(r.tools)))
	for _, t := range r.tools {
		b.WriteString(fmt.Sprintf("- **%s**: %s\n", t.Name, t.Description))
	}
	b.WriteString("\n使用 `help` + 工具名查看详细信息，例如: help notebook_createNotebook")
	return b.String()
}

func formatToolDetail(t *Tool) string {
	var b strings.Builder
	b.WriteString(fmt.Sprintf("## %s\n\n%s\n\n", t.Name, t.Description))
	if len(t.InputSchema.Properties) > 0 {
		b.WriteString("### 参数\n\n")
		for name, prop := range t.InputSchema.Properties {
			pmap := prop.(map[string]any)
			ptype := pmap["type"]
			pdesc := ""
			if d, ok := pmap["description"]; ok {
				pdesc = fmt.Sprintf("%v", d)
			}
			required := "可选"
			for _, r := range t.InputSchema.Required {
				if r == name {
					required = "必填"
				}
			}
			b.WriteString(fmt.Sprintf("- **%s** (%s, %s): %s\n", name, ptype, required, pdesc))
		}
	}
	return b.String()
}
