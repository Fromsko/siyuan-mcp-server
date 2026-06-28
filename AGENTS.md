# siyuan-mcp-server 开发规范

> 面向 AI 代理和人类开发者的仓库操作规范。

## 仓库结构

```
siyuan-mcp-server/
├── main.go / index.ts           # 入口 (Go / TypeScript)
├── pkg/ / src/                  # 核心实现
├── cmd/integration_test/        # Go 集成测试
├── __tests__/                   # TS 测试
├── .github/workflows/           # CI 流水线
│   ├── go-ci.yml                # Go CI (go-mcp 分支)
│   └── (TS CI 由 npm scripts 驱动)
└── AGENTS.md                    # 本文档
```

## 分支策略

| 分支 | 语言 | CI | 发布 |
|------|------|-----|------|
| **main** | TypeScript | npm test + tsc | npm publish / npx |
| **go-mcp** | Go 1.26.4 | go vet + 集成测试 + GoReleaser | GitHub Releases 多平台二进制 |

## 提交规范

### 格式

```
<emoji> <type>: <简短描述>

详细描述：
- 分点 1
- 分点 2
```

| Emoji | Type | 用途 |
|-------|------|------|
| 🐛 | fix | Bug 修复 |
| ✨ | feat | 新功能 |
| 📝 | docs | 文档注释变更 |
| 🔧 | chore/build | 构建/工具/版本号 |
| ♻️ | refactor | 重构 |
| ⚡ | perf | 性能优化 |
| ✅ | test | 增加或修复测试 |
| 🔒 | security | 安全修复 |

---

## Go 版本开发流程 (go-mcp 分支)

### 提交前必须

1. ✅ `go vet ./...` 无警告
2. ✅ `go build .` 无错误
3. ✅ `go run ./cmd/integration_test/` 全部通过（6 个集成测试）
4. ✅ 与官方 API 文档对比，确认端点存在
5. ❌ **禁止**未经上述检查直接推送

### 本地开发

```bash
# 代理配置（必须）
export HTTP_PROXY=http://127.0.0.1:7897
export HTTPS_PROXY=http://127.0.0.1:7897

# 构建
go build -o siyuan-mcp-server-go.exe .

# 带版本号构建
go build -ldflags="-s -w -X main.version=v1.0.0" -o siyuan-mcp-server-go.exe .

# 全部检查
go vet ./... && go build . && go run ./cmd/integration_test/
```

### 版本发布

```bash
# 1. 全部检查通过
go vet ./... && go build . && go run ./cmd/integration_test/

# 2. 提交代码
git add -A
git commit -m "🐛 fix: ..."

# 3. 打 tag（触发 GoReleaser）
git tag go-v1.0.0
git push origin go-mcp
git push origin go-v1.0.0

# 4. GoReleaser 自动构建并发布（不解压，直接可执行）:
#    siyuan-mcp-server_1.0.0_linux_amd64
#    siyuan-mcp-server_1.0.0_linux_arm64
#    siyuan-mcp-server_1.0.0_darwin_amd64
#    siyuan-mcp-server_1.0.0_darwin_arm64
#    siyuan-mcp-server_1.0.0_windows_amd64.exe
#    siyuan-mcp-server_1.0.0_windows_arm64.exe
```

### 测试覆盖

| 测试 | 位置 | 覆盖 |
|------|------|------|
| 集成测试 (6 cases) | `cmd/integration_test/` | initialize, tools/list, help, help+tool, unknown tool, API error |
| 工具覆盖 (38 tools) | 同上 | 验证所有工具名称存在 + help 列出全部 |
| 编译检查 | `go vet` | 静态分析 |
| API 端点对比 | 手动 | 与官方文档逐条对比 |

### 添加新工具

```go
// 在 pkg/tools/handlers.go 的对应分类中添加:
r.Register("category_actionName", "工具描述",
    s("param", mcp.Description("参数说明"), mcp.Required()),
    func(ctx context.Context, req mcp.CallToolRequest) (*mcp.CallToolResult, error) {
        v, err := call("/api/category/endpoint", map[string]any{"param": req.GetString("param", "")})
        if err != nil {
            return mcp.NewToolResultError(err.Error()), nil
        }
        return mcp.NewToolResultText(v), nil
    })

// help 工具会自动发现新工具，无需手动更新文档。
// 不要忘记更新 AGENTS.md 的工具统计数字 (38 → 39)。
```

### 架构图

```
main.go (-mode stdio|http)
├── pkg/siyuan/client.go        HTTP 客户端 (环境变量注入)
├── pkg/tools/registry.go       注册表 (单例, auto-help)
├── pkg/tools/handlers.go       37 工具 (15 大类, 官方 API 全覆盖)
├── pkg/transport/stdio.go      stdio (Claude Desktop/Cursor)
├── pkg/transport/http.go       HTTP (远程部署)
└── cmd/integration_test/       集成测试 (启动真进程测试 MCP 协议)
```

---

## TypeScript 版本开发流程 (main 分支)

### 提交前必须

1. ✅ `npm run build` 通过
2. ✅ `npm test` 通过
3. ✅ 对比官方 API 确认端点存在
4. ❌ **禁止**未经测试直接推送

### 版本发布

```bash
npm run build && npm test
git add -A && git commit -m "🐛 fix: ..."
# 更新 package.json version
git tag vX.Y.Z && git push origin main && git push origin vX.Y.Z
```

---

## SiYuan API 兼容对照

| 类别 | 端点数 | Go | TS | 官方文档 |
|------|--------|-----|-----|----------|
| notebook | 8 | ✅ | ✅ | `/api/notebook/*` |
| filetree | 6 | ✅ | ✅ | `/api/filetree/*` |
| block | 5 | ✅ | ✅ | `/api/block/*` |
| attr | 2 | ✅ | ✅ | `/api/attr/*` |
| query/search | 2 | ✅ | ✅ | `/api/query/sql` |
| template | 2 | ✅ | ✅ | `/api/template/*` |
| file | 2 | ✅ | ✅ | `/api/file/*` |
| export | 2 | ✅ | ✅ | `/api/export/*` |
| convert | 1 | ✅ | ✅ | `/api/convert/*` |
| notification | 2 | ✅ | ✅ | `/api/notification/*` |
| network | 1 | ✅ | ✅ | `/api/network/*` |
| system | 3 | ✅ | ✅ | `/api/system/*` |
| asset | 1 | ✅ | ✅ | `/api/asset/*` |
| **累计** | **37** | **✅** | **✅** | 兼容 SiYuan ≥ 3.0.0 |

官方文档：https://github.com/siyuan-note/siyuan/blob/master/API_zh_CN.md
