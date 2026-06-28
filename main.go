package main

import (
	"fmt"
	"log"
	"os"

	"github.com/Fromsko/siyuan-mcp-server-go/pkg/mcp"
	"github.com/Fromsko/siyuan-mcp-server-go/pkg/siyuan"
)

var version = "1.0.0"

func main() {
	c := siyuan.NewClient()

	if os.Getenv("DEBUG") != "" {
		log.SetOutput(os.Stderr)
		log.Printf("siyuan-mcp-server-go v%s starting", version)
		if c.HasToken() {
			log.Printf("SiYuan API: %s (token configured)", c.BaseURL())
		} else {
			log.Printf("⚠ no token configured, limited mode")
		}
	} else {
		log.SetOutput(os.Stderr)
	}

	s := mcp.NewServer("siyuan-mcp-server", version)

	// notify helper
	type prop = mcp.Property
	req := func(p ...string) []string { return p }

	// ── Notebook tools ──
	s.AddTool("notebook_lsNotebooks", "列出所有笔记本", nil, nil,
		func(args map[string]any) (string, error) {
			return call(c, "/api/notebook/lsNotebooks", map[string]any{})
		})
	s.AddTool("notebook_openNotebook", "打开笔记本", map[string]prop{"notebook": {Type: "string", Description: "笔记本 ID"}}, req("notebook"),
		func(args map[string]any) (string, error) {
			return call(c, "/api/notebook/openNotebook", map[string]any{"notebook": args["notebook"]})
		})
	s.AddTool("notebook_closeNotebook", "关闭笔记本", map[string]prop{"notebook": {Type: "string", Description: "笔记本 ID"}}, req("notebook"),
		func(args map[string]any) (string, error) {
			return call(c, "/api/notebook/closeNotebook", map[string]any{"notebook": args["notebook"]})
		})
	s.AddTool("notebook_renameNotebook", "重命名笔记本", map[string]prop{
		"notebook": {Type: "string", Description: "笔记本 ID"},
		"name":     {Type: "string", Description: "新名称"},
	}, req("notebook", "name"), func(args map[string]any) (string, error) {
		return call(c, "/api/notebook/renameNotebook", map[string]any{"notebook": args["notebook"], "name": args["name"]})
	})
	s.AddTool("notebook_createNotebook", "创建笔记本", map[string]prop{"name": {Type: "string", Description: "笔记本名称"}}, req("name"),
		func(args map[string]any) (string, error) {
			return call(c, "/api/notebook/createNotebook", map[string]any{"name": args["name"]})
		})
	s.AddTool("notebook_removeNotebook", "删除笔记本", map[string]prop{"notebook": {Type: "string", Description: "笔记本 ID"}}, req("notebook"),
		func(args map[string]any) (string, error) {
			return call(c, "/api/notebook/removeNotebook", map[string]any{"notebook": args["notebook"]})
		})
	s.AddTool("notebook_getNotebookConf", "获取笔记本配置", map[string]prop{"notebook": {Type: "string", Description: "笔记本 ID"}}, req("notebook"),
		func(args map[string]any) (string, error) {
			return call(c, "/api/notebook/getNotebookConf", map[string]any{"notebook": args["notebook"]})
		})
	s.AddTool("notebook_setNotebookConf", "设置笔记本配置", map[string]prop{
		"notebook": {Type: "string", Description: "笔记本 ID"},
		"conf":     {Type: "object", Description: "配置对象"},
	}, req("notebook"), func(args map[string]any) (string, error) {
		return call(c, "/api/notebook/setNotebookConf", args)
	})

	// ── Filetree tools ──
	s.AddTool("filetree_createDocWithMd", "通过 Markdown 创建文档",
		map[string]prop{
			"notebook": {Type: "string", Description: "笔记本 ID"},
			"path":     {Type: "string", Description: "文档路径，以 / 开头"},
			"markdown": {Type: "string", Description: "GFM Markdown 内容"},
		}, req("notebook", "path", "markdown"), func(args map[string]any) (string, error) {
			return call(c, "/api/filetree/createDocWithMd", args)
		})
	s.AddTool("filetree_renameDoc", "重命名文档",
		map[string]prop{
			"notebook": {Type: "string", Description: "笔记本 ID"},
			"path":     {Type: "string", Description: "文档路径"},
			"title":    {Type: "string", Description: "新标题"},
		}, req("notebook", "path", "title"), func(args map[string]any) (string, error) {
			return call(c, "/api/filetree/renameDoc", args)
		})
	s.AddTool("filetree_removeDoc", "删除文档",
		map[string]prop{
			"notebook": {Type: "string", Description: "笔记本 ID"},
			"path":     {Type: "string", Description: "文档路径"},
		}, req("notebook", "path"), func(args map[string]any) (string, error) {
			return call(c, "/api/filetree/removeDoc", args)
		})
	s.AddTool("filetree_moveDocs", "移动文档",
		map[string]prop{
			"fromPaths":  {Type: "array", Description: "源路径列表"},
			"toNotebook": {Type: "string", Description: "目标笔记本 ID"},
			"toPath":     {Type: "string", Description: "目标路径"},
		}, req("fromPaths", "toNotebook", "toPath"), func(args map[string]any) (string, error) {
			return call(c, "/api/filetree/moveDocs", args)
		})
	s.AddTool("filetree_getHPathByPath", "根据路径获取人类可读路径",
		map[string]prop{"notebook": {Type: "string", Description: "笔记本 ID"}, "path": {Type: "string", Description: "路径"}},
		req("notebook", "path"), func(args map[string]any) (string, error) {
			return call(c, "/api/filetree/getHPathByPath", args)
		})
	s.AddTool("filetree_getHPathByID", "根据 ID 获取人类可读路径",
		map[string]prop{"id": {Type: "string", Description: "块 ID"}}, req("id"),
		func(args map[string]any) (string, error) {
			return call(c, "/api/filetree/getHPathByID", args)
		})

	// ── Block tools ──
	s.AddTool("block_insertBlock", "插入块 | dataType: markdown|dom",
		map[string]prop{
			"dataType":   {Type: "string", Description: "markdown 或 dom"},
			"data":       {Type: "string", Description: "内容"},
			"previousID": {Type: "string", Description: "前一个块 ID"},
			"parentID":   {Type: "string", Description: "父块 ID"},
		}, req("dataType", "data"), func(args map[string]any) (string, error) {
			return call(c, "/api/block/insertBlock", args)
		})
	s.AddTool("block_updateBlock", "更新块",
		map[string]prop{
			"dataType": {Type: "string", Description: "markdown 或 dom"},
			"data":     {Type: "string", Description: "新内容"},
			"id":       {Type: "string", Description: "块 ID"},
		}, req("dataType", "data", "id"), func(args map[string]any) (string, error) {
			return call(c, "/api/block/updateBlock", args)
		})
	s.AddTool("block_deleteBlock", "删除块", map[string]prop{"id": {Type: "string", Description: "块 ID"}}, req("id"),
		func(args map[string]any) (string, error) { return call(c, "/api/block/deleteBlock", args) })
	s.AddTool("block_moveBlock", "移动块",
		map[string]prop{"id": {Type: "string"}, "previousID": {Type: "string"}, "parentID": {Type: "string"}},
		req("id"), func(args map[string]any) (string, error) {
			return call(c, "/api/block/moveBlock", args)
		})
	s.AddTool("block_getBlockKramdown", "获取块 Kramdown 源码", map[string]prop{"id": {Type: "string"}}, req("id"),
		func(args map[string]any) (string, error) { return call(c, "/api/block/getBlockKramdown", args) })

	// ── Attr tools ──
	s.AddTool("attr_setBlockAttrs", "设置块属性", map[string]prop{"id": {Type: "string"}, "attrs": {Type: "object"}}, req("id"),
		func(args map[string]any) (string, error) { return call(c, "/api/attr/setBlockAttrs", args) })
	s.AddTool("attr_getBlockAttrs", "获取块属性", map[string]prop{"id": {Type: "string"}}, req("id"),
		func(args map[string]any) (string, error) { return call(c, "/api/attr/getBlockAttrs", args) })

	// ── Query / Search tools ──
	s.AddTool("query_sql", "执行 SQL 查询", map[string]prop{"stmt": {Type: "string", Description: "SQL 语句"}}, req("stmt"),
		func(args map[string]any) (string, error) { return call(c, "/api/query/sql", args) })
	s.AddTool("search_fullTextSearch", "全文搜索 (SQL LIKE)", map[string]prop{
		"query": {Type: "string", Description: "搜索关键词"},
		"types": {Type: "array", Description: "块类型过滤"},
		"limit": {Type: "number", Description: "最大结果数 默认32"},
	}, req("query"), func(args map[string]any) (string, error) {
		query := strArg(args, "query")
		limit := 32
		if l, ok := args["limit"].(float64); ok {
			limit = int(l)
		}
		typeFilter := ""
		if types, ok := args["types"].([]any); ok && len(types) > 0 {
			typeFilter = "AND type IN ("
			for i, t := range types {
				if i > 0 {
					typeFilter += ","
				}
				typeFilter += fmt.Sprintf("'%v'", t)
			}
			typeFilter += ")"
		}
		stmt := fmt.Sprintf("SELECT * FROM blocks WHERE content LIKE '%%%s%%' %s LIMIT %d", query, typeFilter, limit)
		return call(c, "/api/query/sql", map[string]any{"stmt": stmt})
	})

	// ── Template tools ──
	s.AddTool("template_render", "渲染模板", map[string]prop{"id": {Type: "string"}, "path": {Type: "string"}}, req("id", "path"),
		func(args map[string]any) (string, error) { return call(c, "/api/template/render", args) })
	s.AddTool("template_renderSprig", "渲染 Sprig 模板", map[string]prop{"template": {Type: "string"}}, req("template"),
		func(args map[string]any) (string, error) { return call(c, "/api/template/renderSprig", args) })

	// ── File tools ──
	s.AddTool("file_getFile", "获取文件", map[string]prop{"path": {Type: "string"}}, req("path"),
		func(args map[string]any) (string, error) { return call(c, "/api/file/getFile", args) })
	s.AddTool("file_putFile", "写入文件", map[string]prop{"path": {Type: "string"}}, req("path"),
		func(args map[string]any) (string, error) { return call(c, "/api/file/putFile", args) })

	// ── Export tools ──
	s.AddTool("export_exportMdContent", "导出 Markdown", map[string]prop{"id": {Type: "string"}}, req("id"),
		func(args map[string]any) (string, error) { return call(c, "/api/export/exportMdContent", args) })
	s.AddTool("export_exportResources", "导出为 ZIP", map[string]prop{"paths": {Type: "array"}, "name": {Type: "string"}}, req("paths"),
		func(args map[string]any) (string, error) { return call(c, "/api/export/exportResources", args) })

	// ── Convert tools ──
	s.AddTool("convert_pandoc", "Pandoc 转换", map[string]prop{"dir": {Type: "string"}, "args": {Type: "array"}}, req("dir"),
		func(args map[string]any) (string, error) { return call(c, "/api/convert/pandoc", args) })

	// ── Notification tools ──
	s.AddTool("notification_pushMsg", "推送消息", map[string]prop{"msg": {Type: "string"}, "timeout": {Type: "number"}}, req("msg"),
		func(args map[string]any) (string, error) { return call(c, "/api/notification/pushMsg", args) })
	s.AddTool("notification_pushErrMsg", "推送报错消息", map[string]prop{"msg": {Type: "string"}, "timeout": {Type: "number"}}, req("msg"),
		func(args map[string]any) (string, error) { return call(c, "/api/notification/pushErrMsg", args) })

	// ── Network tools ──
	s.AddTool("network_forwardProxy", "正向代理", map[string]prop{
		"url": {Type: "string"}, "method": {Type: "string"}, "headers": {Type: "array"},
		"payload": {Type: "object"}, "timeout": {Type: "number"},
	}, req("url"), func(args map[string]any) (string, error) { return call(c, "/api/network/forwardProxy", args) })

	// ── System tools ──
	s.AddTool("system_bootProgress", "获取启动进度", nil, nil,
		func(args map[string]any) (string, error) { return call(c, "/api/system/bootProgress", map[string]any{}) })
	s.AddTool("system_version", "获取系统版本", nil, nil,
		func(args map[string]any) (string, error) { return call(c, "/api/system/version", map[string]any{}) })
	s.AddTool("system_currentTime", "获取系统当前时间", nil, nil,
		func(args map[string]any) (string, error) { return call(c, "/api/system/currentTime", map[string]any{}) })

	// ── Asset tools ──
	s.AddTool("asset_upload", "上传资源文件", map[string]prop{"assetsDirPath": {Type: "string"}}, req("assetsDirPath"),
		func(args map[string]any) (string, error) { return call(c, "/api/asset/upload", args) })

	if err := s.Serve(); err != nil {
		log.Fatalf("server error: %v", err)
	}
}

func call(c *siyuan.Client, endpoint string, body any) (string, error) {
	data, err := c.Call(endpoint, body)
	if err != nil {
		return "", err
	}
	return string(data), nil
}

func strArg(args map[string]any, key string) string {
	if v, ok := args[key].(string); ok {
		return v
	}
	return ""
}
