# siyuan-mcp-server 开发规范

> 本文件面向 AI 代理和人类开发者，规范本仓库的所有操作。

## 提交规范

### 格式

```
<emoji> <type>: <简短描述>

详细描述：
- 分点 1
- 分点 2
```

### Emoji 对照

| Emoji | Type | 用途 |
|-------|------|------|
| 🐛 | fix | Bug 修复 |
| ✨ | feat | 新功能 |
| 📝 | docs | 文档变更 |
| 🔧 | chore | 构建/工具/版本号 |
| ♻️ | refactor | 重构 |
| ⚡ | perf | 性能优化 |
| ✅ | test | 增加测试 |
| 🔒 | security | 安全修复 |

### 示例

```
🐛 fix: MCP 协议违规修复

详细描述：
- index.ts: console.log 改为仅在 NODE_ENV=development 时输出到 stderr
- client.ts: 错误日志尊重运行模式
- version.ts: 增强 readFileSync 健壮性

✨ feat: 新增 5 个 filetree 端点

详细描述：
- 新增 removeDoc 文档删除命令
- 新增 moveDocs 文档移动命令
- 新增 getHPathByPath/getHPathByID 路径查询
```

## 开发流程

### 提交前必须

1. ✅ `npm run build` 通过（TypeScript 编译无错误）
2. ✅ `npm test` 全部通过
3. ✅ 对比官方 API 文档确认端点存在
4. ❌ **禁止**未经测试直接推送

### 版本发布流程

```bash
# 1. 确认构建和测试
npm run build && npm test

# 2. 提交代码
git add -A
git commit -m "🐛 fix: ..."

# 3. 更新版本号
sed -i 's/"version": "x.y.z"/"version": "NEW"/' package.json
git add package.json
git commit -m "🔧 chore: bump version to NEW"

# 4. 打 tag + 推送
git tag vNEW
git push origin main
git push origin vNEW
```

## 思源版本兼容

当前兼容范围记录在 `package.json` 的 `siyuan` 字段中：

```json
{
  "siyuan": {
    "minVersion": "3.0.0",
    "maxVersion": "3.x",
    "apiDoc": "https://github.com/siyuan-note/siyuan/blob/master/API_zh_CN.md"
  }
}
```

每次对比官方 API 文档后，更新兼容版本范围。

### API 对比方法

1. 获取官方文档：`https://raw.githubusercontent.com/siyuan-note/siyuan/master/API_zh_CN.md`
2. 提取所有 `/api/` 路径
3. 逐一对比代码中的 `createHandler('...')` 调用
4. 标注：✅ 匹配 / ❌ 不存在 / ⚠️ 参数不匹配

## 禁止事项

- ❌ 直接推送未测试的代码
- ❌ 使用不存在的 API 端点（必须先查官方文档）
- ❌ 在 stdout 输出非 JSON-RPC 内容
- ❌ 使用 `console.log` 代替 `console.error` 输出日志
