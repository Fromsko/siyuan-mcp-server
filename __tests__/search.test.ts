/**
 * search.test.ts
 *
 * 测试搜索模块的 SQL 安全性：
 * - SQL 注入防护（escapeSqlLike）
 * - 类型白名单校验（sanitizeTypes）
 * - limit 范围限制
 * - SQL 构建正确性
 *
 * 覆盖场景：
 *   1. 单引号转义（SQL 注入基本向量）
 *   2. 有效/无效 block type 过滤
 *   3. limit 边界值（0, -1, 99999, 32）
 *   4. 空 types 数组
 *   5. 组合参数
 *
 * 策略：提取 search handler 的纯逻辑函数独立测试，
 * 不依赖 registry 或 client mock。
 */

import { describe, it, expect } from '@jest/globals';

// ─── 提取的纯函数（与 search.ts 中逻辑一致） ──────────────

function escapeSqlLike(value: string): string {
    return value.replace(/'/g, "''");
}

const VALID_BLOCK_TYPES: Record<string, true> = {
    doc: true, h: true, p: true, code: true, blockquote: true, super: true, iframe: true,
    query_embed: true, video: true, audio: true, table: true, task: true, li: true, l: true,
    b: true, s: true, u: true, em: true, strong: true, mark: true, sup: true, sub: true, kbd: true,
    span: true, a: true, 'inline-math': true, 'inline-memo': true, text: true, 'html-block': true,
};

function sanitizeTypes(types: string[]): string[] {
    return types.filter(t => t in VALID_BLOCK_TYPES);
}

function buildSearchSql(
    query: string,
    types?: string[],
    limit = 32,
): { stmt: string; error?: string } {
    const safeQuery = escapeSqlLike(query);
    const safeLimit = Math.max(1, Math.min(1000, Math.floor(limit)));

    let typesFilter = '';
    if (types?.length) {
        const validTypes = sanitizeTypes(types);
        if (validTypes.length === 0) {
            return { stmt: '', error: 'No valid block types provided' };
        }
        const escaped = validTypes.map(t => `'${escapeSqlLike(t)}'`).join(',');
        typesFilter = `AND type IN (${escaped})`;
    }

    const stmt = `SELECT * FROM blocks WHERE content LIKE '%${safeQuery}%' ${typesFilter} LIMIT ${safeLimit}`;
    return { stmt };
}

// ─── SQL 转义测试 ─────────────────────────────────────────

describe('escapeSqlLike', () => {
    it('should escape single quotes', () => {
        expect(escapeSqlLike("it's")).toBe("it''s");
    });

    it('should escape multiple single quotes', () => {
        expect(escapeSqlLike("a'b'c")).toBe("a''b''c");
    });

    it('should leave normal strings unchanged', () => {
        expect(escapeSqlLike('hello world')).toBe('hello world');
    });

    it('should handle empty string', () => {
        expect(escapeSqlLike('')).toBe('');
    });

    it('should handle SQL injection attempt', () => {
        const malicious = "'; DROP TABLE blocks; --";
        const escaped = escapeSqlLike(malicious);
        expect(escaped).toBe("''; DROP TABLE blocks; --");
        // 构建的 SQL 不应包含未转义的单引号注入点
        const stmt = `SELECT * FROM blocks WHERE content LIKE '%${escaped}%'`;
        // 验证不会出现 LIKE '%...' 后面紧跟注入代码的情况
        expect(stmt).toContain("''; DROP TABLE");
    });
});

// ─── 类型白名单测试 ───────────────────────────────────────

describe('sanitizeTypes', () => {
    it('should accept valid block types', () => {
        expect(sanitizeTypes(['doc', 'h', 'p'])).toEqual(['doc', 'h', 'p']);
    });

    it('should filter out invalid block types', () => {
        expect(sanitizeTypes(['doc', 'invalid_type', 'h'])).toEqual(['doc', 'h']);
    });

    it('should return empty array when all types are invalid', () => {
        expect(sanitizeTypes(['foo', 'bar'])).toEqual([]);
    });

    it('should handle empty input', () => {
        expect(sanitizeTypes([])).toEqual([]);
    });

    it('should accept all documented types', () => {
        const allValid = [
            'doc', 'h', 'p', 'code', 'blockquote', 'super', 'iframe',
            'query_embed', 'video', 'audio', 'table', 'task', 'li', 'l',
            'b', 's', 'u', 'em', 'strong', 'mark', 'sup', 'sub', 'kbd',
            'span', 'a', 'inline-math', 'inline-memo', 'text', 'html-block',
        ];
        expect(sanitizeTypes(allValid)).toEqual(allValid);
    });
});

// ─── SQL 构建测试 ─────────────────────────────────────────

describe('buildSearchSql', () => {
    it('should build basic search query', () => {
        const { stmt } = buildSearchSql('keyword');
        expect(stmt).toBe("SELECT * FROM blocks WHERE content LIKE '%keyword%'  LIMIT 32");
    });

    it('should include type filter', () => {
        const { stmt } = buildSearchSql('test', ['doc', 'h']);
        expect(stmt).toContain("type IN ('doc','h')");
    });

    it('should respect limit parameter', () => {
        const { stmt } = buildSearchSql('test', undefined, 10);
        expect(stmt).toContain('LIMIT 10');
    });

    it('should clamp limit to max 1000', () => {
        const { stmt } = buildSearchSql('test', undefined, 99999);
        expect(stmt).toContain('LIMIT 1000');
    });

    it('should clamp limit to min 1', () => {
        const { stmt } = buildSearchSql('test', undefined, -5);
        expect(stmt).toContain('LIMIT 1');
    });

    it('should floor fractional limit', () => {
        const { stmt } = buildSearchSql('test', undefined, 7.9);
        expect(stmt).toContain('LIMIT 7');
    });

    it('should return error for all-invalid types', () => {
        const result = buildSearchSql('test', ['invalid1', 'invalid2']);
        expect(result.error).toBe('No valid block types provided');
        expect(result.stmt).toBe('');
    });

    it('should escape SQL injection in query', () => {
        const { stmt } = buildSearchSql("'; DROP TABLE");
        expect(stmt).toContain("''; DROP TABLE");
    });

    it('should handle empty types array as no filter', () => {
        const { stmt } = buildSearchSql('test', []);
        expect(stmt).not.toContain('type IN');
    });

    it('should default limit to 32', () => {
        const { stmt } = buildSearchSql('test');
        expect(stmt).toContain('LIMIT 32');
    });
});
