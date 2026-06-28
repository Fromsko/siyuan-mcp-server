// Package tools manages MCP tool registration for SiYuan API operations.
//
// Design rationale:
//
//	   Instead of scattering tool definitions across the codebase, we use a
//	   centralized Registry that:
//	   1. Declares tools with name, description, and type-safe parameters.
//	   2. Provides an auto-generated "help" tool that lists all tools and
//	      shows detailed per-tool documentation (parameters, types, required/optional).
//	   3. Decouples tool definitions from the MCP server transport layer.
//	   4. Enables testing tools in isolation without starting a full server.
//
//	   Adding a new SiYuan API endpoint is a single Register() call.
//	   The help tool automatically picks up the new tool — no manual docs needed.
package tools

import (
	"context"
	"fmt"
	"strings"

	"github.com/Fromsko/siyuan-mcp-server-go/pkg/siyuan"
	"github.com/mark3labs/mcp-go/mcp"
)

// Tool wraps an mcp.Tool with its execution handler.
// The Handler field is excluded from JSON serialization (handled by mcp-go).
type Tool struct {
	mcp.Tool
	Handler func(ctx context.Context, req mcp.CallToolRequest) (*mcp.CallToolResult, error)
}

// Registry manages tool registration and auto-generates help documentation.
// It is the single source of truth for all available SiYuan API tools.
type Registry struct {
	tools  []Tool
	client *siyuan.Client
}

// New creates a tool registry tied to a SiYuan API client.
func New(client *siyuan.Client) *Registry {
	return &Registry{client: client}
}

// Register adds a tool with declarative parameter options.
//
//	name:       MCP tool name (e.g., "notebook_createNotebook")
//	desc:       Human-readable description shown in tools/list and help
//	opts:       mcp.ToolOption for parameter definitions (WithString, WithNumber, etc.)
//	handler:    execution function called when the LLM invokes the tool
//
// Example:
//
//	r.Register("notebook_lsNotebooks", "列出所有笔记本", nil,
//	    func(ctx context.Context, req mcp.CallToolRequest) (*mcp.CallToolResult, error) {
//	        v, err := r.client.Call("/api/notebook/lsNotebooks", map[string]any{})
//	        ...
//	    })
func (r *Registry) Register(name, desc string, opts []mcp.ToolOption, handler func(ctx context.Context, req mcp.CallToolRequest) (*mcp.CallToolResult, error)) {
	t := mcp.NewTool(name, append([]mcp.ToolOption{mcp.WithDescription(desc)}, opts...)...)
	r.tools = append(r.tools, Tool{Tool: t, Handler: handler})
}

// List returns all registered tools for serialization in tools/list response.
// Handlers are excluded from JSON automatically by mcp-go.
func (r *Registry) List() []mcp.Tool {
	result := make([]mcp.Tool, len(r.tools))
	for i, t := range r.tools {
		result[i] = t.Tool
	}
	return result
}

// Get returns a tool by name, or nil if not found.
func (r *Registry) Get(name string) *Tool {
	for i := range r.tools {
		if r.tools[i].Name == name {
			return &r.tools[i]
		}
	}
	return nil
}

// HelpTool returns a built-in tool that auto-lists all registered tools
// and provides detailed per-tool documentation on demand.
//
// Usage by the LLM:
//
//	help              → lists all 37 tools with descriptions
//	help tool=NAME    → shows NAME's parameters, types, and required/optional flags
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

// formatAllTools returns a Markdown list of all registered tools.
func (r *Registry) formatAllTools() string {
	var b strings.Builder
	b.WriteString(fmt.Sprintf("# 可用工具 (%d)\n\n", len(r.tools)))
	for _, t := range r.tools {
		b.WriteString(fmt.Sprintf("- **%s**: %s\n", t.Name, t.Description))
	}
	b.WriteString("\n使用 `help` + 工具名查看详细信息，例如: help notebook_createNotebook")
	return b.String()
}

// formatToolDetail returns Markdown documentation for a single tool.
func formatToolDetail(t *Tool) string {
	var b strings.Builder
	b.WriteString(fmt.Sprintf("## %s\n\n%s\n\n", t.Name, t.Description))
	if len(t.InputSchema.Properties) > 0 {
		b.WriteString("### 参数\n\n")
		for propName, propVal := range t.InputSchema.Properties {
			pmap := propVal.(map[string]any)
			ptype := pmap["type"]
			pdesc := ""
			if d, ok := pmap["description"]; ok {
				pdesc = fmt.Sprintf("%v", d)
			}
			required := "可选"
			for _, r := range t.InputSchema.Required {
				if r == propName {
					required = "必填"
					break
				}
			}
			b.WriteString(fmt.Sprintf("- **%s** (%s, %s): %s\n", propName, ptype, required, pdesc))
		}
	}
	return b.String()
}
