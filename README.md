<div align="center">

# 🧠 思源笔记 MCP 服务器

**让 AI 助手直接操作思源笔记的 Model Context Protocol 服务器**

[![npm version](https://img.shields.io/npm/v/@fromsko/siyuan-mcp-server.svg)](https://www.npmjs.com/package/@fromsko/siyuan-mcp-server)
[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](https://opensource.org/licenses/ISC)
[![SiYuan API](https://img.shields.io/badge/SiYuan%20API-3.x-007ACC.svg)](docs/ref/siyuan-api.md)

</div>

---

## 适配版本

| 项目 | 版本 |
|---|---|
| 思源笔记 | >= 3.0.0（已验证 3.7.1） |
| SiYuan API | [docs/API.md](https://github.com/siyuan-note/siyuan/blob/master/docs/API.md)（50 个非 Database 端点） |
| Node.js | >= 18.0.0 |
| MCP SDK | @modelcontextprotocol/sdk ^1.8.0 |

## 快速开始

```bash
# 直接运行
SIYUAN_TOKEN=your-api-token npx @fromsko/siyuan-mcp-server

# 全局安装
npm install -g @fromsko/siyuan-mcp-server
SIYUAN_TOKEN=your-api-token siyuan-mcp-server
```

| 环境变量 | 必需 | 说明 | 默认值 |
|---|---|---|---|
| `SIYUAN_TOKEN` | ✅ | 思源笔记 API Token（设置 → 关于） | — |
| `SIYUAN_API_URL` | ❌ | 思源 API 地址 | `http://localhost:6806` |

## 给 LLM 的配置说明

如果你是 AI 助手，请将以下配置添加到你的 MCP 客户端配置中：

```json
{
  "mcpServers": {
    "siyuan": {
      "command": "npx",
      "args": ["-y", "@fromsko/siyuan-mcp-server"],
      "env": {
        "SIYUAN_TOKEN": "<用户提供的 API Token>",
        "SIYUAN_API_URL": "http://localhost:6806"
      }
    }
  }
}
```

配置文件位置：
- **Claude Desktop**: `~/Library/Application Support/Claude/claude_desktop_config.json`（macOS）或 `%APPDATA%\Claude\claude_desktop_config.json`（Windows）
- **Cursor**: `.cursor/mcp.json`

配置完成后重启客户端，即可使用 50 个思源笔记操作工具（笔记本管理、文档操作、块级编辑、全文搜索、SQL 查询等）。

## 功能概览

| 类别 | 命令空间 | 端点数 | 能力 |
|---|---|---|---|
| 📓 笔记本 | `notebook.*` | 8 | 创建/删除/重命名/配置 |
| 📄 文档 | `filetree.*` | 11 | 创建/删除/移动/重命名（支持 hpath 自动解析） |
| 🧱 块操作 | `block.*` | 11 | 插入/更新/删除/移动/折叠/展开 |
| 🔍 搜索 | `search.*` / `sql.*` | 3 | 全文搜索/SQL 查询/事务刷新 |
| 📎 属性 | `attr.*` | 2 | 设置/获取块属性 |
| 📁 文件 | `file.*` | 5 | 读写/删除/重命名/列目录 |
| 📋 模板 | `template.*` | 2 | 渲染模板/Sprig |
| 📤 导出 | `export.*` | 2 | 导出 Markdown/导出资源包 |
| 🔄 转换 | `convert.*` | 1 | Pandoc 格式转换 |
| 🔔 通知 | `notification.*` | 2 | 推送消息 |
| 🌐 网络 | `network.*` | 1 | 正向代理 |
| ⚙️ 系统 | `system.*` | 3 | 版本/启动进度/当前时间 |

## 开发

```bash
git clone https://github.com/Fromsko/siyuan-mcp-server.git
cd siyuan-mcp-server
npm install && npm run build && npm test
```

详细开发文档：

| 文档 | 说明 |
|---|---|
| [docs/development.md](docs/development.md) | 开发指南、项目结构、添加端点流程 |
| [docs/mcp-usage.md](docs/mcp-usage.md) | MCP 使用指南 |
| [docs/ref/siyuan-api.md](docs/ref/siyuan-api.md) | 官方 SiYuan API 文档 |
| [llms.txt](llms.txt) | LLM 导向的项目简介 |
| [AGENTS.md](AGENTS.md) | 提交规范和开发约束 |

## 问题排查

**无法连接思源笔记** → 检查：思源是否运行、Token 是否正确、端口是否正确（默认 6806）

**命令执行失败** → 确认笔记本/文档存在、Token 权限足够

**连接远程思源** → 设置 `SIYUAN_API_URL=http://your-server:6806`

## 开源协议

ISC — 详见 [LICENSE](LICENSE)

## 致谢

- 🌟 [onigeya](https://github.com/onigeya/siyuan-mcp-server) — 原始项目
- 🙏 [思源笔记](https://github.com/siyuan-note/siyuan) 团队
- 🤖 [Anthropic](https://www.anthropic.com/) — MCP 协议
