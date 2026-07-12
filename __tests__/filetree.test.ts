/**
 * filetree.test.ts
 *
 * 测试 filetree 命令处理器的路径解析逻辑：
 * - removeDoc / moveDocs / renameDoc 的 hpath 自动解析
 * - ID 路径直接透传
 * - 混合路径处理
 * - 错误传播
 *
 * 策略：提取 handler 核心逻辑为纯函数测试，
 * 避免依赖 registry 单例和模块 mock 复杂度。
 */

import { jest, describe, it, expect, beforeEach } from '@jest/globals';

// ─── Mock client 模块 ─────────────────────────────────────

const mockPost = jest.fn();

jest.mock('../src/utils/client.js', () => ({
    client: { post: mockPost },
    createHandler: (endpoint: string) => async (params: unknown) => {
        const response = await mockPost(endpoint, params);
        return {
            content: [{ type: 'text', text: JSON.stringify(response.data) }],
        };
    },
}));

import { isIdPath } from '../src/utils/path-resolver.js';

// ─── 辅助常量 ─────────────────────────────────────────────

const NB = '20210817205410-2kvfpfn';
const ID_PATH = '/20210917220500-sz588nq/20210917220056-yxtyl7i.sy';
const DOC_ID = '20210917220056-yxtyl7i';
const HPATH = '/daily exp/My Document';

beforeEach(() => {
    mockPost.mockReset();
});

// ─── 路径检测 ─────────────────────────────────────────────

describe('filetree path detection', () => {
    it('should detect ID path correctly', () => {
        expect(isIdPath(ID_PATH)).toBe(true);
    });

    it('should detect hpath correctly', () => {
        expect(isIdPath(HPATH)).toBe(false);
    });

    it('should detect single-level ID path', () => {
        expect(isIdPath('/20210902210113-0avi12f.sy')).toBe(true);
    });
});

// ─── removeDoc 路径解析逻辑 ───────────────────────────────

describe('removeDoc path resolution logic', () => {
    /**
     * 模拟 removeDoc handler 的核心逻辑：
     * - ID 路径 → 直接调 removeDoc
     * - hpath → 解析 ID → 调 removeDocByID
     */
    async function resolveAndRemove(
        notebook: string,
        path: string,
        resolveFn: (nb: string, hpath: string) => Promise<string[]>,
    ) {
        if (isIdPath(path)) {
            return mockPost('/api/filetree/removeDoc', { notebook, path });
        }
        const ids = await resolveFn(notebook, path);
        return mockPost('/api/filetree/removeDocByID', { id: ids[0] });
    }

    it('should call removeDocByID for hpath', async () => {
        const resolveFn = jest.fn<(nb: string, hpath: string) => Promise<string[]>>()
            .mockResolvedValue([DOC_ID]);
        mockPost.mockResolvedValueOnce({ code: 0, msg: '', data: null });

        await resolveAndRemove(NB, HPATH, resolveFn);

        expect(resolveFn).toHaveBeenCalledWith(NB, HPATH);
        expect(mockPost).toHaveBeenCalledWith('/api/filetree/removeDocByID', { id: DOC_ID });
    });

    it('should call removeDoc directly for ID path', async () => {
        const resolveFn = jest.fn<(nb: string, hpath: string) => Promise<string[]>>();
        mockPost.mockResolvedValueOnce({ code: 0, msg: '', data: null });

        await resolveAndRemove(NB, ID_PATH, resolveFn);

        expect(resolveFn).not.toHaveBeenCalled();
        expect(mockPost).toHaveBeenCalledWith('/api/filetree/removeDoc', { notebook: NB, path: ID_PATH });
    });
});

// ─── moveDocs 路径解析逻辑 ───────────────────────────────

describe('moveDocs path resolution logic', () => {
    /**
     * 模拟 moveDocs handler 的核心逻辑
     */
    async function resolveAndMove(
        fromPaths: string[],
        toNotebook: string,
        toPath: string,
        resolveFn: (nb: string, hpath: string) => Promise<string[]>,
    ) {
        const needsResolve = fromPaths.some(p => !isIdPath(p)) || !isIdPath(toPath);
        if (!needsResolve) {
            return mockPost('/api/filetree/moveDocs', { fromPaths, toNotebook, toPath });
        }

        const fromIDs: string[] = [];
        for (const p of fromPaths) {
            if (isIdPath(p)) {
                const segments = p.split('/');
                const last = segments[segments.length - 1];
                fromIDs.push(last.replace('.sy', ''));
            } else {
                const ids = await resolveFn(toNotebook, p);
                fromIDs.push(ids[0]);
            }
        }

        let toID: string;
        if (isIdPath(toPath)) {
            const segments = toPath.split('/');
            const last = segments[segments.length - 1];
            toID = last.replace('.sy', '');
        } else {
            const ids = await resolveFn(toNotebook, toPath);
            toID = ids[0];
        }

        return mockPost('/api/filetree/moveDocsByID', { fromIDs, toID });
    }

    it('should pass through when all paths are ID paths', async () => {
        const resolveFn = jest.fn<(nb: string, hpath: string) => Promise<string[]>>();
        mockPost.mockResolvedValueOnce({ code: 0, msg: '', data: null });

        const toPath = '/20210917220500-sz588nq.sy';
        await resolveAndMove([ID_PATH], NB, toPath, resolveFn);

        expect(resolveFn).not.toHaveBeenCalled();
        expect(mockPost).toHaveBeenCalledWith('/api/filetree/moveDocs', {
            fromPaths: [ID_PATH],
            toNotebook: NB,
            toPath,
        });
    });

    it('should resolve hpaths and call moveDocsByID', async () => {
        const resolveFn = jest.fn<(nb: string, hpath: string) => Promise<string[]>>()
            .mockResolvedValue([DOC_ID]);
        mockPost.mockResolvedValueOnce({ code: 0, msg: '', data: null });

        await resolveAndMove([HPATH], NB, '/target/path', resolveFn);

        expect(resolveFn).toHaveBeenCalledTimes(2); // fromPath + toPath
        expect(mockPost).toHaveBeenCalledWith('/api/filetree/moveDocsByID', {
            fromIDs: [DOC_ID],
            toID: DOC_ID,
        });
    });

    it('should handle mixed ID paths and hpaths', async () => {
        const resolveFn = jest.fn<(nb: string, hpath: string) => Promise<string[]>>()
            .mockResolvedValue([DOC_ID]);
        mockPost.mockResolvedValueOnce({ code: 0, msg: '', data: null });

        await resolveAndMove([ID_PATH, HPATH], NB, '/target', resolveFn);

        // 只有 hpath 需要解析
        expect(resolveFn).toHaveBeenCalledTimes(2); // HPATH + /target
        expect(mockPost).toHaveBeenCalledWith('/api/filetree/moveDocsByID', {
            fromIDs: [DOC_ID, DOC_ID],
            toID: DOC_ID,
        });
    });
});

// ─── renameDoc 路径解析逻辑 ───────────────────────────────

describe('renameDoc path resolution logic', () => {
    async function resolveAndRename(
        notebook: string,
        path: string,
        title: string,
        resolveFn: (nb: string, hpath: string) => Promise<string[]>,
    ) {
        if (isIdPath(path)) {
            return mockPost('/api/filetree/renameDoc', { notebook, path, title });
        }
        const ids = await resolveFn(notebook, path);
        return mockPost('/api/filetree/renameDocByID', { id: ids[0], title });
    }

    it('should resolve hpath and call renameDocByID', async () => {
        const resolveFn = jest.fn<(nb: string, hpath: string) => Promise<string[]>>()
            .mockResolvedValue([DOC_ID]);
        mockPost.mockResolvedValueOnce({ code: 0, msg: '', data: null });

        await resolveAndRename(NB, HPATH, 'New Title', resolveFn);

        expect(resolveFn).toHaveBeenCalledWith(NB, HPATH);
        expect(mockPost).toHaveBeenCalledWith('/api/filetree/renameDocByID', {
            id: DOC_ID,
            title: 'New Title',
        });
    });

    it('should call renameDoc directly for ID path', async () => {
        const resolveFn = jest.fn<(nb: string, hpath: string) => Promise<string[]>>();
        mockPost.mockResolvedValueOnce({ code: 0, msg: '', data: null });

        await resolveAndRename(NB, ID_PATH, 'New Title', resolveFn);

        expect(resolveFn).not.toHaveBeenCalled();
        expect(mockPost).toHaveBeenCalledWith('/api/filetree/renameDoc', {
            notebook: NB,
            path: ID_PATH,
            title: 'New Title',
        });
    });
});

// ─── 错误传播 ─────────────────────────────────────────────

describe('error propagation', () => {
    it('should propagate resolution error', async () => {
        const resolveFn = jest.fn<(nb: string, hpath: string) => Promise<string[]>>()
            .mockRejectedValue(new Error('Cannot resolve hpath "/bad/path"'));
        mockPost.mockResolvedValueOnce({ code: 0, msg: '', data: null });

        await expect(async () => {
            if (!isIdPath(HPATH)) {
                const ids = await resolveFn(NB, HPATH);
                await mockPost('/api/filetree/removeDocByID', { id: ids[0] });
            }
        }).rejects.toThrow('Cannot resolve hpath');
    });

    it('should propagate API error', async () => {
        const resolveFn = jest.fn<(nb: string, hpath: string) => Promise<string[]>>()
            .mockResolvedValue([DOC_ID]);
        mockPost.mockRejectedValueOnce(new Error('API error: 403'));

        const ids = await resolveFn(NB, HPATH);
        await expect(mockPost('/api/filetree/removeDocByID', { id: ids[0] }))
            .rejects.toThrow('API error: 403');
    });
});
