# 思源笔记 MCP 服务器使用指南

## 启动服务器

### 方法 1: npx 直接运行（推荐）

```bash
SIYUAN_TOKEN=your-api-token npx @fromsko/siyuan-mcp-server
```

### 方法 2: 全局安装后运行

```bash
npm install -g @fromsko/siyuan-mcp-server
SIYUAN_TOKEN=your-api-token siyuan-mcp-server
```

### 方法 3: 本地构建运行

```bash
git clone https://github.com/Fromsko/siyuan-mcp-server.git
cd siyuan-mcp-server
npm install && npm run build
SIYUAN_TOKEN=your-api-token node dist/server.js
```

## MCP 客户端配置

### Claude Desktop

在 Claude Desktop 配置文件中添加（`~/.claude/claude_desktop_config.json`）：

```json
{
  "mcpServers": {
    "siyuan-mcp-server": {
      "command": "npx",
      "args": ["-y", "@fromsko/siyuan-mcp-server"],
      "env": {
        "SIYUAN_TOKEN": "your-api-token"
      }
    }
  }
}
```

### Cursor / 其他 MCP 客户端

参考 `claude-desktop-config.json` 文件，大多数 MCP 客户端配置格式相同。

## 环境变量

| 变量 | 必需 | 说明 | 默认值 |
|---|---|---|---|
| `SIYUAN_TOKEN` | 是 | 思源笔记 API Token（设置 → 关于） | — |
| `SIYUAN_API_URL` | 否 | 思源 API 地址 | `http://localhost:6806` |

## 环境要求

- **Node.js**: >= 18.0.0
- **思源笔记**: >= 3.0.0

## 文件结构

```
siyuan-mcp-server/
├── dist/                          # 构建输出
│   └── server.js                  # 入口文件
├── src/                           # 源代码
│   ├── server.ts                  # MCP 服务器入口
│   ├── index.ts                   # 模块导出
│   ├── tools/commands/            # 命令处理器
│   └── utils/                     # 工具函数
├── __tests__/                     # 测试
├── docs/ref/                      # 参考文档
├── claude-desktop-config.json     # Claude Desktop 配置示例
└── package.json
```

## 相关链接

- [项目主页](https://github.com/Fromsko/siyuan-mcp-server)
- [npm 包](https://www.npmjs.com/package/@fromsko/siyuan-mcp-server)
- [MCP 协议文档](https://modelcontextprotocol.io/)
- [思源笔记官网](https://b3log.org/siyuan/)
