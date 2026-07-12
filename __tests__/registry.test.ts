/**
 * registry.test.ts
 *
 * 测试命令注册表模块：
 * - registerCommand 注册 / 覆盖警告
 * - listCommands 过滤 / 格式化
 * - getCommandHelp 帮助信息生成
 * - executeCommand 参数验证 / 错误处理
 *
 * 覆盖场景：
 *   1. 注册：正常注册、重复注册警告
 *   2. 列表：按命名空间过滤、空结果
 *   3. 帮助：有文档 / 无文档、未知命令
 *   4. 执行：正常执行、Zod 验证失败、handler 抛错
 *
 * 注意：CommandRegistry 是单例，测试间共享状态。
 * 每个 describe 块使用不同的 namespace 避免冲突。
 */

import { jest, describe, it, expect, beforeEach, beforeAll } from '@jest/globals';
import { z } from 'zod';
import type { CommandHandler } from '../src/utils/registry.js';

// Mock client 避免路径解析模块的副作用
jest.mock('../src/utils/client.js', () => ({
    client: { post: jest.fn() },
    createHandler: jest.fn(),
}));

import { registry } from '../src/utils/registry.js';

// ─── 辅助：构建测试用命令 ─────────────────────────────────

function makeCommand(overrides: Partial<CommandHandler> = {}): CommandHandler {
    return {
        namespace: 'tst',
        name: 'hello',
        description: 'A test command',
        params: z.object({ name: z.string().describe('User name') }),
        handler: async (params: unknown) => {
            const { name } = params as { name: string };
            return {
                content: [{ type: 'text', text: `Hello, ${name}!` }],
            };
        },
        ...overrides,
    };
}

// ─── 注册测试 ─────────────────────────────────────────────

describe('registerCommand', () => {
    it('should register a command without error', () => {
        expect(() => registry.registerCommand(makeCommand({
            namespace: 'reg', name: 'ok',
        }))).not.toThrow();
    });

    it('should warn on duplicate registration', () => {
        const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
        registry.registerCommand(makeCommand({ namespace: 'reg', name: 'dup' }));
        registry.registerCommand(makeCommand({ namespace: 'reg', name: 'dup' }));
        expect(warnSpy).toHaveBeenCalledWith(
            expect.stringContaining('reg.dup')
        );
        warnSpy.mockRestore();
    });
});

// ─── 列表测试 ─────────────────────────────────────────────

describe('listCommands', () => {
    beforeAll(() => {
        registry.registerCommand(makeCommand({ namespace: 'lst', name: 'alpha' }));
        registry.registerCommand(makeCommand({ namespace: 'lst', name: 'beta' }));
        registry.registerCommand(makeCommand({ namespace: 'other', name: 'gamma' }));
    });

    it('should list registered commands', () => {
        const result = registry.listCommands();
        expect(result.content[0].text).toContain('lst.alpha');
    });

    it('should filter by namespace', () => {
        const result = registry.listCommands('lst');
        expect(result.content[0].text).toContain('lst.alpha');
        expect(result.content[0].text).toContain('lst.beta');
        expect(result.content[0].text).not.toContain('other.gamma');
    });

    it('should return empty list for unknown namespace', () => {
        const result = registry.listCommands('nonexistent');
        expect(result.content[0].text).not.toContain('lst.alpha');
    });
});

// ─── 帮助测试 ─────────────────────────────────────────────

describe('getCommandHelp', () => {
    beforeAll(() => {
        registry.registerCommand(makeCommand({
            namespace: 'help',
            name: 'withDoc',
            documentation: {
                description: 'Say hello',
                params: { name: { type: 'string', description: 'User name', required: true } },
                returns: { type: 'string', description: 'Greeting', properties: {} },
                examples: [{
                    description: 'Say hello to Alice',
                    params: { name: 'Alice' },
                    response: { greeting: 'Hello, Alice!' },
                }],
            },
        }));
        registry.registerCommand(makeCommand({
            namespace: 'help',
            name: 'noDoc',
            description: 'Fallback desc',
        }));
    });

    it('should return help for a registered command', () => {
        const result = registry.getCommandHelp('help.withDoc');
        expect(result.content[0].text).toContain('help.withDoc');
        expect(result.content[0].text).toContain('Say hello');
        expect(result.content[0].text).toContain('Alice');
    });

    it('should return error for unknown command', () => {
        const result = registry.getCommandHelp('nonexistent.cmd');
        expect(result.isError).toBe(true);
        expect(result.content[0].text).toContain('不存在');
    });

    it('should use description as fallback when no documentation', () => {
        const result = registry.getCommandHelp('help.noDoc');
        expect(result.content[0].text).toContain('Fallback desc');
    });
});

// ─── 执行测试 ─────────────────────────────────────────────

describe('executeCommand', () => {
    beforeAll(() => {
        registry.registerCommand(makeCommand({ namespace: 'exec', name: 'greet' }));
        registry.registerCommand({
            namespace: 'exec',
            name: 'noop',
            description: 'No-op',
            params: z.object({}),
            handler: async () => ({ content: [{ type: 'text', text: 'ok' }] }),
        });
        registry.registerCommand(makeCommand({
            namespace: 'exec',
            name: 'thrower',
            handler: async () => { throw new Error('boom'); },
        }));
    });

    it('should execute a command with valid params', async () => {
        const result = await registry.executeCommand('exec.greet', { name: 'World' });
        expect(result.content[0].text).toBe('Hello, World!');
    });

    it('should return error for unknown command', async () => {
        const result = await registry.executeCommand('nonexistent.cmd');
        expect(result.isError).toBe(true);
        expect(result.content[0].text).toContain('不存在');
    });

    it('should return Zod validation error for invalid params', async () => {
        const result = await registry.executeCommand('exec.greet', { name: 123 });
        expect(result.isError).toBe(true);
        expect(result.content[0].text).toContain('参数验证失败');
    });

    it('should return error when handler throws', async () => {
        const result = await registry.executeCommand('exec.thrower', { name: 'X' });
        expect(result.isError).toBe(true);
        expect(result.content[0].text).toContain('boom');
    });

    it('should execute with empty params when defaults exist', async () => {
        const result = await registry.executeCommand('exec.noop');
        expect(result.content[0].text).toBe('ok');
    });
});
