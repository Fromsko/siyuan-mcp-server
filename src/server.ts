#!/usr/bin/env node
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { registerCommandTool } from './tools/commands.js';
import { registerAssetsHandlers } from './tools/commands/assets.js';
import { registerAttrHandlers } from './tools/commands/attr.js';
import { registerBlockHandlers } from './tools/commands/block.js';
import { registerConvertHandlers } from './tools/commands/convert.js';
import { registerExportHandlers } from './tools/commands/export.js';
import { registerFileHandlers } from './tools/commands/file.js';
import { registerFiletreeHandlers } from './tools/commands/filetree.js';
import { registerNetworkHandlers } from './tools/commands/network.js';
import { registerNotebookHandlers } from './tools/commands/notebook.js';
import { registerNotificationHandlers } from './tools/commands/notification.js';
import { registerQueryHandlers } from './tools/commands/query.js';
import { registerSearchHandlers } from './tools/commands/search.js';
import { registerSqlHandlers } from './tools/commands/sql.js';
import { registerSystemHandlers } from './tools/commands/system.js';
import { registerTemplateHandlers } from './tools/commands/template.js';
import { registerHelpTool } from './tools/help.js';
import { registerQueryTool } from './tools/queries.js';

// 创建 MCP 服务器实例
const server = new McpServer({
    name: "siyuan-mcp-server",
    version: "1.0.0",
});

// 创建传输层实例
const transport = new StdioServerTransport();

// 注册命令处理器
registerNotebookHandlers();
registerFiletreeHandlers();
registerBlockHandlers();
registerAttrHandlers();
registerSqlHandlers();
registerQueryHandlers();
registerSearchHandlers();
registerAssetsHandlers();
registerFileHandlers();
registerExportHandlers();
registerTemplateHandlers();
registerNotificationHandlers();
registerSystemHandlers();
registerConvertHandlers();
registerNetworkHandlers();

// 注册工具
registerCommandTool(server);
registerQueryTool(server);
registerHelpTool(server);

// 启动服务器
// 注意：MCP 协议要求只输出 JSON-RPC 消息，所以不输出任何调试信息

// 环境变量配置
function getEnvironmentConfig() {
    // 尝试从多个源获取 SIYUAN_TOKEN
    const token = process.env.SIYUAN_TOKEN ||
        process.env.SIYUAN_API_TOKEN ||
        process.env.SIYUAN_AUTH_TOKEN;

    if (!token) {
        // 仅在开发模式下输出警告
        if (process.env.NODE_ENV === 'development') {
            console.warn('Warning: SIYUAN_TOKEN environment variable not detected');
            console.log('Please set the token using one of the following:');
            console.log('  1. Environment variable: export SIYUAN_TOKEN=your_token');
            console.log('  2. MCP config: set env.SIYUAN_TOKEN in client config');
            console.log('  3. System environment: add to system environment variables');
            console.log('Server will continue to start but may not access SiYuan API properly');
        }
        return null;
    }

    return token;
}

// 获取环境配置
const siyuanToken = getEnvironmentConfig();

if (siyuanToken && process.env.NODE_ENV === 'development') {
    console.log('Environment variables check passed');
    console.log('SIYUAN_TOKEN: ****' + siyuanToken.slice(-4));
} else if (process.env.NODE_ENV === 'development') {
    console.log('Server will start in limited mode');
}

// 启动服务器连接
try {
    server.connect(transport);
    // 不输出任何启动成功消息以符合 MCP 协议
} catch (error) {
    console.error('Server startup failed:', error);
    process.exit(1);
}

export { server };
