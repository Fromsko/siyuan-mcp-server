package tools

import (
	"context"
	"encoding/json"
	"fmt"

	"github.com/mark3labs/mcp-go/mcp"
)

// RegisterAll registers all 37 SiYuan MCP tools.
func (r *Registry) RegisterAll() {
	// ── helpers ──
	call := func(endpoint string, body any) (string, error) {
		data, err := r.client.Call(endpoint, body)
		if err != nil {
			return "", err
		}
		return string(data), nil
	}
	text := func(s string) *mcp.CallToolResult { return mcp.NewToolResultText(s) }
	// errR := func(s string) *mcp.CallToolResult { return mcp.NewToolResultError(s) }
	_ = text

	s := func(name string, opts ...mcp.PropertyOption) []mcp.ToolOption {
		return []mcp.ToolOption{mcp.WithString(name, opts...)}
	}
	nn := func(name string, opts ...mcp.PropertyOption) mcp.ToolOption {
		return mcp.WithNumber(name, opts...)
	}

	// ── Notebook ──
	r.Register("notebook_lsNotebooks", "列出所有笔记本", nil,
		func(ctx context.Context, req mcp.CallToolRequest) (*mcp.CallToolResult, error) {
			v, err := call("/api/notebook/lsNotebooks", map[string]any{})
			if err != nil {
				return mcp.NewToolResultError(err.Error()), nil
			}
			return mcp.NewToolResultText(v), nil
		})
	r.Register("notebook_openNotebook", "打开笔记本",
		s("notebook", mcp.Description("笔记本 ID"), mcp.Required()),
		func(ctx context.Context, req mcp.CallToolRequest) (*mcp.CallToolResult, error) {
			v, err := call("/api/notebook/openNotebook", map[string]any{"notebook": req.GetString("notebook", "")})
			if err != nil {
				return mcp.NewToolResultError(err.Error()), nil
			}
			return mcp.NewToolResultText(v), nil
		})
	r.Register("notebook_closeNotebook", "关闭笔记本",
		s("notebook", mcp.Description("笔记本 ID"), mcp.Required()),
		func(ctx context.Context, req mcp.CallToolRequest) (*mcp.CallToolResult, error) {
			v, err := call("/api/notebook/closeNotebook", map[string]any{"notebook": req.GetString("notebook", "")})
			if err != nil {
				return mcp.NewToolResultError(err.Error()), nil
			}
			return mcp.NewToolResultText(v), nil
		})
	r.Register("notebook_renameNotebook", "重命名笔记本",
		append(s("notebook", mcp.Description("笔记本 ID"), mcp.Required()), s("name", mcp.Description("新名称"), mcp.Required())...),
		func(ctx context.Context, req mcp.CallToolRequest) (*mcp.CallToolResult, error) {
			v, err := call("/api/notebook/renameNotebook", map[string]any{"notebook": req.GetString("notebook", ""), "name": req.GetString("name", "")})
			if err != nil {
				return mcp.NewToolResultError(err.Error()), nil
			}
			return mcp.NewToolResultText(v), nil
		})
	r.Register("notebook_createNotebook", "创建笔记本",
		s("name", mcp.Description("笔记本名称"), mcp.Required()),
		func(ctx context.Context, req mcp.CallToolRequest) (*mcp.CallToolResult, error) {
			v, err := call("/api/notebook/createNotebook", map[string]any{"name": req.GetString("name", "")})
			if err != nil {
				return mcp.NewToolResultError(err.Error()), nil
			}
			return mcp.NewToolResultText(v), nil
		})
	r.Register("notebook_removeNotebook", "删除笔记本",
		s("notebook", mcp.Description("笔记本 ID"), mcp.Required()),
		func(ctx context.Context, req mcp.CallToolRequest) (*mcp.CallToolResult, error) {
			v, err := call("/api/notebook/removeNotebook", map[string]any{"notebook": req.GetString("notebook", "")})
			if err != nil {
				return mcp.NewToolResultError(err.Error()), nil
			}
			return mcp.NewToolResultText(v), nil
		})
	r.Register("notebook_getNotebookConf", "获取笔记本配置",
		s("notebook", mcp.Description("笔记本 ID"), mcp.Required()),
		func(ctx context.Context, req mcp.CallToolRequest) (*mcp.CallToolResult, error) {
			v, err := call("/api/notebook/getNotebookConf", map[string]any{"notebook": req.GetString("notebook", "")})
			if err != nil {
				return mcp.NewToolResultError(err.Error()), nil
			}
			return mcp.NewToolResultText(v), nil
		})
	r.Register("notebook_setNotebookConf", "设置笔记本配置",
		[]mcp.ToolOption{
			mcp.WithString("notebook", mcp.Description("笔记本 ID"), mcp.Required()),
			mcp.WithAny("conf", mcp.Description("配置对象")),
		},
		func(ctx context.Context, req mcp.CallToolRequest) (*mcp.CallToolResult, error) {
			v, err := call("/api/notebook/setNotebookConf", req.GetArguments())
			if err != nil {
				return mcp.NewToolResultError(err.Error()), nil
			}
			return mcp.NewToolResultText(v), nil
		})

	// ── Filetree ──
	r.Register("filetree_createDocWithMd", "通过 Markdown 创建文档",
		[]mcp.ToolOption{
			mcp.WithString("notebook", mcp.Description("笔记本 ID"), mcp.Required()),
			mcp.WithString("path", mcp.Description("文档路径，以 / 开头"), mcp.Required()),
			mcp.WithString("markdown", mcp.Description("GFM Markdown 内容"), mcp.Required()),
		},
		func(ctx context.Context, req mcp.CallToolRequest) (*mcp.CallToolResult, error) {
			v, err := call("/api/filetree/createDocWithMd", req.GetArguments())
			if err != nil {
				return mcp.NewToolResultError(err.Error()), nil
			}
			return mcp.NewToolResultText(v), nil
		})
	r.Register("filetree_renameDoc", "重命名文档",
		[]mcp.ToolOption{
			mcp.WithString("notebook", mcp.Description("笔记本 ID"), mcp.Required()),
			mcp.WithString("path", mcp.Description("文档路径"), mcp.Required()),
			mcp.WithString("title", mcp.Description("新标题"), mcp.Required()),
		},
		func(ctx context.Context, req mcp.CallToolRequest) (*mcp.CallToolResult, error) {
			v, err := call("/api/filetree/renameDoc", req.GetArguments())
			if err != nil {
				return mcp.NewToolResultError(err.Error()), nil
			}
			return mcp.NewToolResultText(v), nil
		})
	r.Register("filetree_removeDoc", "删除文档",
		[]mcp.ToolOption{
			mcp.WithString("notebook", mcp.Description("笔记本 ID"), mcp.Required()),
			mcp.WithString("path", mcp.Description("文档路径"), mcp.Required()),
		},
		func(ctx context.Context, req mcp.CallToolRequest) (*mcp.CallToolResult, error) {
			v, err := call("/api/filetree/removeDoc", req.GetArguments())
			if err != nil {
				return mcp.NewToolResultError(err.Error()), nil
			}
			return mcp.NewToolResultText(v), nil
		})
	r.Register("filetree_moveDocs", "移动文档",
		[]mcp.ToolOption{
			mcp.WithArray("fromPaths", mcp.Description("源路径列表"), mcp.Required()),
			mcp.WithString("toNotebook", mcp.Description("目标笔记本 ID"), mcp.Required()),
			mcp.WithString("toPath", mcp.Description("目标路径"), mcp.Required()),
		},
		func(ctx context.Context, req mcp.CallToolRequest) (*mcp.CallToolResult, error) {
			v, err := call("/api/filetree/moveDocs", req.GetArguments())
			if err != nil {
				return mcp.NewToolResultError(err.Error()), nil
			}
			return mcp.NewToolResultText(v), nil
		})
	r.Register("filetree_getHPathByPath", "根据路径获取人类可读路径",
		[]mcp.ToolOption{
			mcp.WithString("notebook", mcp.Description("笔记本 ID"), mcp.Required()),
			mcp.WithString("path", mcp.Description("路径"), mcp.Required()),
		},
		func(ctx context.Context, req mcp.CallToolRequest) (*mcp.CallToolResult, error) {
			v, err := call("/api/filetree/getHPathByPath", req.GetArguments())
			if err != nil {
				return mcp.NewToolResultError(err.Error()), nil
			}
			return mcp.NewToolResultText(v), nil
		})
	r.Register("filetree_getHPathByID", "根据 ID 获取人类可读路径",
		s("id", mcp.Description("块 ID"), mcp.Required()),
		func(ctx context.Context, req mcp.CallToolRequest) (*mcp.CallToolResult, error) {
			v, err := call("/api/filetree/getHPathByID", map[string]any{"id": req.GetString("id", "")})
			if err != nil {
				return mcp.NewToolResultError(err.Error()), nil
			}
			return mcp.NewToolResultText(v), nil
		})

	// ── Block ──
	r.Register("block_insertBlock", "插入块（dataType: markdown 或 dom）",
		[]mcp.ToolOption{
			mcp.WithString("dataType", mcp.Description("markdown 或 dom"), mcp.Required()),
			mcp.WithString("data", mcp.Description("内容"), mcp.Required()),
			mcp.WithString("previousID", mcp.Description("前一个块 ID")),
			mcp.WithString("parentID", mcp.Description("父块 ID")),
		},
		func(ctx context.Context, req mcp.CallToolRequest) (*mcp.CallToolResult, error) {
			v, err := call("/api/block/insertBlock", req.GetArguments())
			if err != nil {
				return mcp.NewToolResultError(err.Error()), nil
			}
			return mcp.NewToolResultText(v), nil
		})
	r.Register("block_updateBlock", "更新块",
		[]mcp.ToolOption{
			mcp.WithString("dataType", mcp.Description("markdown 或 dom"), mcp.Required()),
			mcp.WithString("data", mcp.Description("新内容"), mcp.Required()),
			mcp.WithString("id", mcp.Description("块 ID"), mcp.Required()),
		},
		func(ctx context.Context, req mcp.CallToolRequest) (*mcp.CallToolResult, error) {
			v, err := call("/api/block/updateBlock", req.GetArguments())
			if err != nil {
				return mcp.NewToolResultError(err.Error()), nil
			}
			return mcp.NewToolResultText(v), nil
		})
	r.Register("block_deleteBlock", "删除块",
		s("id", mcp.Description("块 ID"), mcp.Required()),
		func(ctx context.Context, req mcp.CallToolRequest) (*mcp.CallToolResult, error) {
			v, err := call("/api/block/deleteBlock", map[string]any{"id": req.GetString("id", "")})
			if err != nil {
				return mcp.NewToolResultError(err.Error()), nil
			}
			return mcp.NewToolResultText(v), nil
		})
	r.Register("block_moveBlock", "移动块",
		[]mcp.ToolOption{
			mcp.WithString("id", mcp.Description("块 ID"), mcp.Required()),
			mcp.WithString("previousID", mcp.Description("前一个块 ID")),
			mcp.WithString("parentID", mcp.Description("父块 ID")),
		},
		func(ctx context.Context, req mcp.CallToolRequest) (*mcp.CallToolResult, error) {
			v, err := call("/api/block/moveBlock", req.GetArguments())
			if err != nil {
				return mcp.NewToolResultError(err.Error()), nil
			}
			return mcp.NewToolResultText(v), nil
		})
	r.Register("block_getBlockKramdown", "获取块 Kramdown 源码",
		s("id", mcp.Description("块 ID"), mcp.Required()),
		func(ctx context.Context, req mcp.CallToolRequest) (*mcp.CallToolResult, error) {
			v, err := call("/api/block/getBlockKramdown", map[string]any{"id": req.GetString("id", "")})
			if err != nil {
				return mcp.NewToolResultError(err.Error()), nil
			}
			return mcp.NewToolResultText(v), nil
		})

	// ── Attr ──
	r.Register("attr_getBlockAttrs", "获取块属性",
		s("id", mcp.Description("块 ID"), mcp.Required()),
		func(ctx context.Context, req mcp.CallToolRequest) (*mcp.CallToolResult, error) {
			v, err := call("/api/attr/getBlockAttrs", map[string]any{"id": req.GetString("id", "")})
			if err != nil {
				return mcp.NewToolResultError(err.Error()), nil
			}
			return mcp.NewToolResultText(v), nil
		})
	r.Register("attr_setBlockAttrs", "设置块属性",
		[]mcp.ToolOption{
			mcp.WithString("id", mcp.Description("块 ID"), mcp.Required()),
			mcp.WithAny("attrs", mcp.Description("属性对象")),
		},
		func(ctx context.Context, req mcp.CallToolRequest) (*mcp.CallToolResult, error) {
			v, err := call("/api/attr/setBlockAttrs", req.GetArguments())
			if err != nil {
				return mcp.NewToolResultError(err.Error()), nil
			}
			return mcp.NewToolResultText(v), nil
		})

	// ── SQL / Search ──
	r.Register("query_sql", "执行 SQL 查询",
		s("stmt", mcp.Description("SQL 语句"), mcp.Required()),
		func(ctx context.Context, req mcp.CallToolRequest) (*mcp.CallToolResult, error) {
			v, err := call("/api/query/sql", map[string]any{"stmt": req.GetString("stmt", "")})
			if err != nil {
				return mcp.NewToolResultError(err.Error()), nil
			}
			return mcp.NewToolResultText(v), nil
		})
	r.Register("search_fullTextSearch", "全文搜索（通过 SQL LIKE 实现）",
		[]mcp.ToolOption{
			mcp.WithString("query", mcp.Description("搜索关键词"), mcp.Required()),
			mcp.WithArray("types", mcp.Description("块类型过滤")),
			nn("limit", mcp.Description("最大结果数（默认 32）")),
		},
		func(ctx context.Context, req mcp.CallToolRequest) (*mcp.CallToolResult, error) {
			q := req.GetString("query", "")
			limit := 32
			if l, ok := req.GetArguments()["limit"].(float64); ok {
				limit = int(l)
			}
			filter := ""
			if types, ok := req.GetArguments()["types"].([]any); ok && len(types) > 0 {
				filter = "AND type IN ("
				for i, t := range types {
					if i > 0 {
						filter += ","
					}
					filter += fmt.Sprintf("'%v'", t)
				}
				filter += ")"
			}
			stmt := fmt.Sprintf("SELECT * FROM blocks WHERE content LIKE '%%%s%%' %s LIMIT %d", q, filter, limit)
			v, err := call("/api/query/sql", map[string]any{"stmt": stmt})
			if err != nil {
				return mcp.NewToolResultError(err.Error()), nil
			}
			return mcp.NewToolResultText(v), nil
		})

	// ── Template ──
	r.Register("template_render", "渲染模板",
		[]mcp.ToolOption{
			mcp.WithString("id", mcp.Description("文档 ID"), mcp.Required()),
			mcp.WithString("path", mcp.Description("模板文件绝对路径"), mcp.Required()),
		},
		func(ctx context.Context, req mcp.CallToolRequest) (*mcp.CallToolResult, error) {
			v, err := call("/api/template/render", req.GetArguments())
			if err != nil {
				return mcp.NewToolResultError(err.Error()), nil
			}
			return mcp.NewToolResultText(v), nil
		})
	r.Register("template_renderSprig", "渲染 Sprig 模板",
		s("template", mcp.Description("模板内容"), mcp.Required()),
		func(ctx context.Context, req mcp.CallToolRequest) (*mcp.CallToolResult, error) {
			v, err := call("/api/template/renderSprig", map[string]any{"template": req.GetString("template", "")})
			if err != nil {
				return mcp.NewToolResultError(err.Error()), nil
			}
			return mcp.NewToolResultText(v), nil
		})

	// ── File ──
	r.Register("file_getFile", "获取文件内容",
		s("path", mcp.Description("工作空间路径下的文件路径"), mcp.Required()),
		func(ctx context.Context, req mcp.CallToolRequest) (*mcp.CallToolResult, error) {
			v, err := call("/api/file/getFile", map[string]any{"path": req.GetString("path", "")})
			if err != nil {
				return mcp.NewToolResultError(err.Error()), nil
			}
			return mcp.NewToolResultText(v), nil
		})
	r.Register("file_putFile", "写入文件",
		[]mcp.ToolOption{
			mcp.WithString("path", mcp.Description("工作空间路径"), mcp.Required()),
			mcp.WithAny("file", mcp.Description("文件内容(base64)")),
		},
		func(ctx context.Context, req mcp.CallToolRequest) (*mcp.CallToolResult, error) {
			v, err := call("/api/file/putFile", req.GetArguments())
			if err != nil {
				return mcp.NewToolResultError(err.Error()), nil
			}
			return mcp.NewToolResultText(v), nil
		})

	// ── Export ──
	r.Register("export_exportMdContent", "导出文档为 Markdown",
		s("id", mcp.Description("文档块 ID"), mcp.Required()),
		func(ctx context.Context, req mcp.CallToolRequest) (*mcp.CallToolResult, error) {
			v, err := call("/api/export/exportMdContent", map[string]any{"id": req.GetString("id", "")})
			if err != nil {
				return mcp.NewToolResultError(err.Error()), nil
			}
			return mcp.NewToolResultText(v), nil
		})
	r.Register("export_exportResources", "导出文件与目录为 ZIP",
		[]mcp.ToolOption{
			mcp.WithArray("paths", mcp.Description("文件/文件夹路径列表"), mcp.Required()),
			mcp.WithString("name", mcp.Description("导出文件名 (不含 .zip)")),
		},
		func(ctx context.Context, req mcp.CallToolRequest) (*mcp.CallToolResult, error) {
			v, err := call("/api/export/exportResources", req.GetArguments())
			if err != nil {
				return mcp.NewToolResultError(err.Error()), nil
			}
			return mcp.NewToolResultText(v), nil
		})

	// ── Convert ──
	r.Register("convert_pandoc", "Pandoc 转换",
		[]mcp.ToolOption{
			mcp.WithString("dir", mcp.Description("工作目录名"), mcp.Required()),
			mcp.WithArray("args", mcp.Description("Pandoc 命令行参数"), mcp.Required()),
		},
		func(ctx context.Context, req mcp.CallToolRequest) (*mcp.CallToolResult, error) {
			v, err := call("/api/convert/pandoc", req.GetArguments())
			if err != nil {
				return mcp.NewToolResultError(err.Error()), nil
			}
			return mcp.NewToolResultText(v), nil
		})

	// ── Notification ──
	r.Register("notification_pushMsg", "推送消息",
		[]mcp.ToolOption{
			mcp.WithString("msg", mcp.Description("消息内容"), mcp.Required()),
			nn("timeout", mcp.Description("显示时间(毫秒, 默认7000)")),
		},
		func(ctx context.Context, req mcp.CallToolRequest) (*mcp.CallToolResult, error) {
			v, err := call("/api/notification/pushMsg", req.GetArguments())
			if err != nil {
				return mcp.NewToolResultError(err.Error()), nil
			}
			return mcp.NewToolResultText(v), nil
		})
	r.Register("notification_pushErrMsg", "推送报错消息",
		[]mcp.ToolOption{
			mcp.WithString("msg", mcp.Description("错误消息"), mcp.Required()),
			nn("timeout", mcp.Description("显示时间(毫秒, 默认7000)")),
		},
		func(ctx context.Context, req mcp.CallToolRequest) (*mcp.CallToolResult, error) {
			v, err := call("/api/notification/pushErrMsg", req.GetArguments())
			if err != nil {
				return mcp.NewToolResultError(err.Error()), nil
			}
			return mcp.NewToolResultText(v), nil
		})

	// ── Network ──
	r.Register("network_forwardProxy", "正向代理",
		[]mcp.ToolOption{
			mcp.WithString("url", mcp.Description("转发 URL"), mcp.Required()),
			mcp.WithString("method", mcp.Description("HTTP 方法 (默认 GET)")),
			mcp.WithArray("headers", mcp.Description("请求头列表")),
			mcp.WithAny("payload", mcp.Description("请求体")),
		},
		func(ctx context.Context, req mcp.CallToolRequest) (*mcp.CallToolResult, error) {
			v, err := call("/api/network/forwardProxy", req.GetArguments())
			if err != nil {
				return mcp.NewToolResultError(err.Error()), nil
			}
			return mcp.NewToolResultText(v), nil
		})

	// ── System ──
	r.Register("system_bootProgress", "获取启动进度", nil,
		func(ctx context.Context, req mcp.CallToolRequest) (*mcp.CallToolResult, error) {
			v, err := call("/api/system/bootProgress", map[string]any{})
			if err != nil {
				return mcp.NewToolResultError(err.Error()), nil
			}
			return mcp.NewToolResultText(v), nil
		})
	r.Register("system_version", "获取系统版本", nil,
		func(ctx context.Context, req mcp.CallToolRequest) (*mcp.CallToolResult, error) {
			v, err := call("/api/system/version", map[string]any{})
			if err != nil {
				return mcp.NewToolResultError(err.Error()), nil
			}
			return mcp.NewToolResultText(v), nil
		})
	r.Register("system_currentTime", "获取系统当前时间", nil,
		func(ctx context.Context, req mcp.CallToolRequest) (*mcp.CallToolResult, error) {
			v, err := call("/api/system/currentTime", map[string]any{})
			if err != nil {
				return mcp.NewToolResultError(err.Error()), nil
			}
			return mcp.NewToolResultText(v), nil
		})

	// ── Asset ──
	r.Register("asset_upload", "上传资源文件",
		[]mcp.ToolOption{
			mcp.WithString("assetsDirPath", mcp.Description("资源文件夹路径"), mcp.Required()),
			mcp.WithArray("file", mcp.Description("文件列表")),
		},
		func(ctx context.Context, req mcp.CallToolRequest) (*mcp.CallToolResult, error) {
			v, err := call("/api/asset/upload", req.GetArguments())
			if err != nil {
				return mcp.NewToolResultError(err.Error()), nil
			}
			return mcp.NewToolResultText(v), nil
		})
}

// unused import suppressor
var _ = json.Marshal
