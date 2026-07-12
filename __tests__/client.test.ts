/**
 * client.test.ts
 *
 * 测试 SiYuan HTTP 客户端模块：
 * - createHandler 工厂函数
 * - MCP 响应格式包装
 * - 参数透传
 *
 * 策略：spyOn client.post 方法，测试 createHandler 行为。
 * createHandler 内部调用 client.post，我们拦截这个调用。
 */

import { jest, describe, it, expect, beforeEach, afterAll } from '@jest/globals';
import { client, createHandler } from '../src/utils/client.js';

// ─── Spy on client.post ───────────────────────────────────

const originalPost = client.post.bind(client);
const postSpy = jest.spyOn(client, 'post') as jest.SpiedFunction<typeof client.post>;

afterAll(() => {
    postSpy.mockRestore();
});

// ─── createHandler 测试 ───────────────────────────────────

describe('createHandler', () => {
    beforeEach(() => {
        postSpy.mockReset();
    });

    it('should return a function', () => {
        const handler = createHandler('/api/test');
        expect(typeof handler).toBe('function');
    });

    it('should call client.post with the correct endpoint and params', async () => {
        postSpy.mockResolvedValueOnce({
            code: 0,
            msg: '',
            data: { id: '123' },
        });

        const handler = createHandler('/api/notebook/lsNotebooks');
        await handler({});

        expect(postSpy).toHaveBeenCalledWith('/api/notebook/lsNotebooks', {});
    });

    it('should wrap response.data in MCP content format', async () => {
        postSpy.mockResolvedValueOnce({
            code: 0,
            msg: '',
            data: { notebooks: [] },
        });

        const handler = createHandler('/api/notebook/lsNotebooks');
        const result = await handler({});

        expect(result).toEqual({
            content: [{
                type: 'text',
                text: JSON.stringify({ notebooks: [] }),
            }],
        });
    });

    it('should handle null data response', async () => {
        postSpy.mockResolvedValueOnce({
            code: 0,
            msg: '',
            data: null,
        });

        const handler = createHandler('/api/filetree/removeDoc');
        const result = await handler({ notebook: 'nb', path: '/doc.sy' });

        expect(result.content[0].text).toBe('null');
    });

    it('should pass through all params to client.post', async () => {
        postSpy.mockResolvedValueOnce({
            code: 0,
            msg: '',
            data: 'doc-id',
        });

        const params = { notebook: 'nb-id', path: '/foo', markdown: '# Hello' };
        const handler = createHandler('/api/filetree/createDocWithMd');
        await handler(params);

        expect(postSpy).toHaveBeenCalledWith('/api/filetree/createDocWithMd', params);
    });
});
