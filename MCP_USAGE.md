# 思源笔记 MCP 服务器使用指南

## 🚀 启动服务器

### 方法 1: 直接运行

```bash
cd /Users/fromsko/Desktop/Code/company/code/code_fork/frontend-monorepo/onigeya_siyuan-mcp-server
SIYUAN_TOKEN=aoqz8at28b6ihmxo ./dist/server.js
```

### 方法 2: 使用 Node.js

```bash
cd /Users/fromsko/Desktop/Code/company/code/code_fork/frontend-monorepo/onigeya_siyuan-mcp-server
SIYUAN_TOKEN=aoqz8at28b6ihmxo node dist/server.js
```

## 📋 MCP 客户端配置

### Claude Desktop 配置

将以下内容添加到您的 Claude Desktop 配置文件中：

```json
{
	"mcpServers": {
		"siyuan-mcp-server": {
			"command": "node",
			"args": [
				"/Users/fromsko/Desktop/Code/company/code/code_fork/frontend-monorepo/onigeya_siyuan-mcp-server/dist/server.js"
			],
			"env": {
				"SIYUAN_TOKEN": "aoqz8at28b6ihmxo"
			}
		}
	}
}
```

### 通用 MCP 客户端配置

参考 `mcp-server-config.json` 文件，其中包含完整的服务器信息。

### 简化配置

参考 `claude-desktop-config.json` 文件，适用于大多数 MCP 客户端。

## 🔧 环境要求

- **Node.js**: >= 18.0.0
- **环境变量**: SIYUAN_TOKEN（必需）

## 📝 启动输出示例

当服务器成功启动时，您应该看到类似以下的输出：

```
🚀 启动思源笔记 MCP 服务器...
📝 服务器名称: siyuan-mcp-server
🔢 版本: 1.2.8
🔗 传输协议: stdio
✅ 环境变量检查通过
🔑 SIYUAN_TOKEN: ****hmxo
🎉 MCP 服务器启动成功!
📡 等待客户端连接...
🛠️  服务器已就绪，可提供思源笔记相关工具
```

## 🛠️ 故障排除

### 常见错误

1. **缺少 SIYUAN_TOKEN**

   ```
   ❌ 错误: 缺少 SIYUAN_TOKEN 环境变量
   💡 使用方法: SIYUAN_TOKEN=your_token node server.js
   ```

   **解决方案**: 确保设置了正确的 SIYUAN_TOKEN 环境变量

2. **权限错误**

   ```bash
   chmod +x dist/server.js
   ```

3. **构建错误**
   ```bash
   bun run build
   ```

## 📁 文件结构

```
onigeya_siyuan-mcp-server/
├── dist/                          # 构建输出目录
│   └── server.js                  # 主服务器文件（可执行）
├── src/                           # 源代码目录
│   └── server.ts                  # 主服务器源文件
├── mcp-server-config.json         # 完整的 MCP 配置
├── claude-desktop-config.json     # Claude Desktop 简化配置
└── MCP_USAGE.md                   # 使用说明文档
```

## 🔗 相关链接

- [项目主页](https://github.com/onigeya/siyuan-mcp-server)
- [MCP 协议文档](https://modelcontextprotocol.io/)
- [思源笔记官网](https://b3log.org/siyuan/)
