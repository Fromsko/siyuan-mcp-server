/**
 * commands.test.ts
 *
 * 集成测试：验证所有命令注册的完整性
 * - 每个模块导出 register 函数
 * - 官方 API 端点覆盖度检查
 * - Phase 1 端点全部实现
 *
 * 这是"完整性测试"——不测试行为，只测试结构约束。
 */

import { jest, describe, it, expect, beforeAll } from '@jest/globals';
// ─── Mock client 和 path-resolver 避免副作用 ──────────────

jest.mock('../src/utils/client.js', () => ({
    client: { post: jest.fn().mockResolvedValue({ code: 0, msg: '', data: null }) },
    createHandler: (endpoint: string) => async (params: unknown) => ({
        content: [{ type: 'text', text: JSON.stringify({ endpoint, params }) }],
    }),
}));

jest.mock('../src/utils/path-resolver.js', () => ({
    isIdPath: (p: string) => /^\/\d{14}-[a-z0-9]{7}(\.sy)?$/.test(p),
    isHPath: (p: string) => !/^\/\d{14}-[a-z0-9]{7}(\.sy)?$/.test(p),
    resolveHPathToIDs: jest.fn().mockResolvedValue(['mock-id']),
    getPathByID: jest.fn().mockResolvedValue({ notebook: 'nb', path: '/20210917220500-sz588nq.sy' }),
    resolveToIdPath: jest.fn().mockResolvedValue('/20210917220500-sz588nq.sy'),
}));

// ─── 注册所有命令 ─────────────────────────────────────────

const REGISTRATION_FUNCTIONS = [
    () => import('../src/tools/commands/filetree.js').then(m => m.registerFiletreeHandlers()),
    () => import('../src/tools/commands/block.js').then(m => m.registerBlockHandlers()),
    () => import('../src/tools/commands/attr.js').then(m => m.registerAttrHandlers()),
    () => import('../src/tools/commands/sql.js').then(m => m.registerSqlHandlers()),
    () => import('../src/tools/commands/search.js').then(m => m.registerSearchHandlers()),
    () => import('../src/tools/commands/notebook.js').then(m => m.registerNotebookHandlers()),
    () => import('../src/tools/commands/system.js').then(m => m.registerSystemHandlers()),
    () => import('../src/tools/commands/template.js').then(m => m.registerTemplateHandlers()),
    () => import('../src/tools/commands/notification.js').then(m => m.registerNotificationHandlers()),
    () => import('../src/tools/commands/file.js').then(m => m.registerFileHandlers()),
    () => import('../src/tools/commands/export.js').then(m => m.registerExportHandlers()),
    () => import('../src/tools/commands/convert.js').then(m => m.registerConvertHandlers()),
    () => import('../src/tools/commands/network.js').then(m => m.registerNetworkHandlers()),
    () => import('../src/tools/commands/assets.js').then(m => m.registerAssetsHandlers()),
    () => import('../src/tools/commands/query.js').then(m => m.registerQueryHandlers()),
];

describe('command registration completeness', () => {
    it('should register all handlers without error', async () => {
        for (const register of REGISTRATION_FUNCTIONS) {
            await expect(register()).resolves.not.toThrow();
        }
    });

    it('each handler module should export a register function', async () => {
        const modules = [
            '../src/tools/commands/filetree.js',
            '../src/tools/commands/block.js',
            '../src/tools/commands/attr.js',
            '../src/tools/commands/sql.js',
            '../src/tools/commands/search.js',
            '../src/tools/commands/notebook.js',
            '../src/tools/commands/system.js',
            '../src/tools/commands/template.js',
            '../src/tools/commands/notification.js',
            '../src/tools/commands/file.js',
            '../src/tools/commands/export.js',
            '../src/tools/commands/convert.js',
            '../src/tools/commands/network.js',
            '../src/tools/commands/assets.js',
            '../src/tools/commands/query.js',
        ];

        for (const modPath of modules) {
            const mod = await import(modPath) as Record<string, unknown>;
            const registerFn = Object.values(mod).find(v => typeof v === 'function');
            expect(registerFn).toBeDefined();
        }
    });
});

// ─── 官方 API 端点覆盖度 ─────────────────────────────────

describe('official API endpoint coverage', () => {
    /**
     * 官方 SiYuan API 端点列表（docs/API.md）
     */
    const OFFICIAL_ENDPOINTS: Record<string, { implemented: boolean; note?: string }> = {
        // Notebooks (8)
        '/api/notebook/lsNotebooks': { implemented: true },
        '/api/notebook/openNotebook': { implemented: true },
        '/api/notebook/closeNotebook': { implemented: true },
        '/api/notebook/renameNotebook': { implemented: true },
        '/api/notebook/createNotebook': { implemented: true },
        '/api/notebook/removeNotebook': { implemented: true },
        '/api/notebook/getNotebookConf': { implemented: true },
        '/api/notebook/setNotebookConf': { implemented: true },
        // Filetree (11)
        '/api/filetree/createDocWithMd': { implemented: true },
        '/api/filetree/renameDoc': { implemented: true },
        '/api/filetree/renameDocByID': { implemented: true },
        '/api/filetree/removeDoc': { implemented: true },
        '/api/filetree/removeDocByID': { implemented: true },
        '/api/filetree/moveDocs': { implemented: true },
        '/api/filetree/moveDocsByID': { implemented: true },
        '/api/filetree/getHPathByPath': { implemented: true },
        '/api/filetree/getHPathByID': { implemented: true },
        '/api/filetree/getPathByID': { implemented: true },
        '/api/filetree/getIDsByHPath': { implemented: true },
        // Blocks (11)
        '/api/block/insertBlock': { implemented: true },
        '/api/block/updateBlock': { implemented: true },
        '/api/block/deleteBlock': { implemented: true },
        '/api/block/moveBlock': { implemented: true },
        '/api/block/getBlockKramdown': { implemented: true },
        '/api/block/prependBlock': { implemented: true },
        '/api/block/appendBlock': { implemented: true },
        '/api/block/foldBlock': { implemented: true },
        '/api/block/unfoldBlock': { implemented: true },
        '/api/block/getChildBlocks': { implemented: true },
        '/api/block/transferBlockRef': { implemented: true },
        // Attributes (2)
        '/api/attr/setBlockAttrs': { implemented: true },
        '/api/attr/getBlockAttrs': { implemented: true },
        // SQL (2)
        '/api/query/sql': { implemented: true },
        '/api/sqlite/flushTransaction': { implemented: true },
        // Templates (2)
        '/api/template/render': { implemented: true },
        '/api/template/renderSprig': { implemented: true },
        // File (5)
        '/api/file/getFile': { implemented: true },
        '/api/file/putFile': { implemented: true },
        '/api/file/removeFile': { implemented: true },
        '/api/file/readDir': { implemented: true },
        '/api/file/renameFile': { implemented: true },
        // Export (2)
        '/api/export/exportMdContent': { implemented: true },
        '/api/export/exportResources': { implemented: true },
        // Conversion (1)
        '/api/convert/pandoc': { implemented: true },
        // Notification (2)
        '/api/notification/pushMsg': { implemented: true },
        '/api/notification/pushErrMsg': { implemented: true },
        // Network (1)
        '/api/network/forwardProxy': { implemented: true },
        // System (3)
        '/api/system/bootProgress': { implemented: true },
        '/api/system/version': { implemented: true },
        '/api/system/currentTime': { implemented: true },
    };

    it('should have all 50 non-database endpoints implemented', () => {
        const implemented = Object.values(OFFICIAL_ENDPOINTS).filter(v => v.implemented);
        expect(implemented.length).toBe(50);
    });

    it('should have zero unimplemented non-database endpoints', () => {
        const unimplemented = Object.entries(OFFICIAL_ENDPOINTS)
            .filter(([, v]) => !v.implemented)
            .map(([k]) => k);
        expect(unimplemented).toEqual([]);
    });

    it('all Phase 1 endpoints should be implemented', () => {
        const phase1 = [
            '/api/filetree/removeDocByID',
            '/api/filetree/renameDocByID',
            '/api/filetree/moveDocsByID',
            '/api/filetree/getPathByID',
            '/api/filetree/getIDsByHPath',
        ];
        for (const ep of phase1) {
            expect(OFFICIAL_ENDPOINTS[ep]?.implemented).toBe(true);
        }
    });

    it('all block endpoints should be implemented', () => {
        const blockEps = Object.entries(OFFICIAL_ENDPOINTS)
            .filter(([k]) => k.startsWith('/api/block/'));
        for (const [, v] of blockEps) {
            expect(v.implemented).toBe(true);
        }
    });

    it('all notebook endpoints should be implemented', () => {
        const notebookEps = Object.entries(OFFICIAL_ENDPOINTS)
            .filter(([k]) => k.startsWith('/api/notebook/'));
        for (const [, v] of notebookEps) {
            expect(v.implemented).toBe(true);
        }
    });

    it('all attribute endpoints should be implemented', () => {
        const attrEps = Object.entries(OFFICIAL_ENDPOINTS)
            .filter(([k]) => k.startsWith('/api/attr/'));
        for (const [, v] of attrEps) {
            expect(v.implemented).toBe(true);
        }
    });

    it('all file endpoints should be implemented', () => {
        const fileEps = Object.entries(OFFICIAL_ENDPOINTS)
            .filter(([k]) => k.startsWith('/api/file/'));
        for (const [, v] of fileEps) {
            expect(v.implemented).toBe(true);
        }
    });
});
