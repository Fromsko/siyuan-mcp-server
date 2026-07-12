# 开发指南

## 本地开发环境搭建

```bash
# 克隆项目
git clone https://github.com/Fromsko/siyuan-mcp-server.git
cd siyuan-mcp-server

# 安装依赖
npm install

# 构建
npm run build

# 运行测试
npm test

# 开发模式（需要本地思源笔记）
SIYUAN_TOKEN=your-token node dist/server.js
```

## 技术栈

| 项目 | 版本/说明 |
|---|---|
| 运行时 | Node.js >= 18.0.0 |
| 语言 | TypeScript >= 5.0.0（strict 模式） |
| 包管理 | npm |
| MCP SDK | @modelcontextprotocol/sdk ^1.8.0 |
| HTTP 客户端 | axios ^1.8.4 |
| 参数校验 | zod ^3.24.2 |
| 测试 | Jest ^29.7.0 + ts-jest |

## 项目结构

```
siyuan-mcp-server/
├── src/
│   ├── server.ts              # MCP 服务器入口
│   ├── index.ts               # 模块导出
│   ├── tools/
│   │   ├── commands/          # 命令处理器（按命名空间分文件）
│   │   │   ├── filetree.ts    # 文档操作（11 端点）
│   │   │   ├── block.ts       # 块操作（11 端点）
│   │   │   ├── notebook.ts    # 笔记本管理（8 端点）
│   │   │   ├── attr.ts        # 属性操作（2 端点）
│   │   │   ├── sql.ts         # SQL 查询（2 端点）
│   │   │   ├── search.ts      # 全文搜索
│   │   │   ├── file.ts        # 文件操作（5 端点）
│   │   │   ├── template.ts    # 模板渲染（2 端点）
│   │   │   ├── export.ts      # 导出（2 端点）
│   │   │   ├── convert.ts     # 格式转换（1 端点）
│   │   │   ├── notification.ts# 通知（2 端点）
│   │   │   ├── network.ts     # 网络代理（1 端点）
│   │   │   ├── system.ts      # 系统信息（3 端点）
│   │   │   └── assets.ts      # 资源上传（1 端点）
│   │   ├── help.ts            # 帮助工具
│   │   └── index.ts           # 工具导出
│   └── utils/
│       ├── client.ts          # SiYuan HTTP 客户端 + createHandler
│       ├── registry.ts        # 命令注册表（单例）
│       ├── path-resolver.ts   # hpath ↔ ID 路径解析
│       └── version.ts         # 版本读取
├── __tests__/                 # 测试（80 个用例）
├── llms.txt                   # LLM 导向项目简介
├── docs/
│   ├── ref/                   # 参考文档
│   │   └── siyuan-api.md      # 官方 API 文档
│   ├── mcp-usage.md           # MCP 使用指南
│   └── development.md         # 本文档
├── package.json
└── tsconfig.json
```

## 添加新端点

1. 在 `docs/ref/siyuan-api.md` 中找到官方 API 定义
2. 在对应的 `src/tools/commands/<namespace>.ts` 中添加 handler：

```typescript
// 1. 定义 handler
const newHandler: CommandHandler = {
    namespace,
    name: 'newEndpoint',
    description: 'Description',
    params: z.object({
        id: z.string().describe('Block ID')
    }),
    handler: createHandler('/api/block/newEndpoint'),
    documentation: {
        description: 'What it does',
        params: { id: { type: 'string', description: 'Block ID', required: true } },
        returns: { type: 'object', description: 'Result', properties: {} },
        examples: [{ description: 'Example', params: { id: 'xxx' }, response: {} }],
        apiLink: 'https://github.com/siyuan-note/siyuan/blob/master/docs/API.md#endpoint'
    }
};

// 2. 注册
export function registerBlockHandlers() {
    // ... existing handlers
    registry.registerCommand(newHandler);
}
```

3. 在 `__tests__/commands.test.ts` 中更新 `OFFICIAL_ENDPOINTS` 覆盖度
4. 运行 `npm run build && npm test`

## 测试

```bash
# 运行全部测试
npm test

# 测试文件说明
# __tests__/path-resolver.test.ts  — 路径解析（纯函数 + mock API）
# __tests__/registry.test.ts       — 命令注册表
# __tests__/client.test.ts         — HTTP 客户端
# __tests__/filetree.test.ts       — 文件树操作（hpath 自动解析）
# __tests__/search.test.ts         — SQL 注入防护
# __tests__/commands.test.ts       — 端点覆盖度完整性
# __tests__/stdio-server.test.ts   — MCP 协议集成测试
```

## API 覆盖度

当前实现 **50 个非 Database 端点**，覆盖思源笔记 API 文档中除 `/api/av/*`（Database/AV）外的所有端点。

详见 `docs/ref/siyuan-api.md` 官方文档。

## 提交规范

```
🐛 fix: Bug 修复
✨ feat: 新功能
📝 docs: 文档变更
🔧 chore: 构建/工具/版本号
♻️ refactor: 重构
✅ test: 增加测试
```

详见 `AGENTS.md`。
