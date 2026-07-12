/**
 * path-resolver.test.ts
 *
 * 测试路径解析工具模块：
 * - isIdPath / isHPath 纯函数（正则检测）
 * - resolveHPathToIDs / getPathByID（mock API 调用）
 * - resolveToIdPath（组合解析）
 *
 * 覆盖场景：
 *   1. 单层 ID 路径 / 多层嵌套 ID 路径
 *   2. 人类可读路径（中文、空格、特殊字符）
 *   3. 边界：空字符串、只有斜杠、无 .sy 后缀
 *   4. API 返回空数组 / 异常时抛错
 *   5. resolveToIdPath 短路：已是 ID 路径直接返回
 *
 * 策略：isIdPath/isHPath 是纯函数直接测试；
 * resolve 系列函数 spyOn client.post 后测试。
 */

import { jest, describe, it, expect, beforeEach, afterAll } from '@jest/globals';
import { client } from '../src/utils/client.js';
import { isIdPath, isHPath, resolveHPathToIDs, getPathByID, resolveToIdPath } from '../src/utils/path-resolver.js';

// ─── Spy on client.post ───────────────────────────────────

const postSpy = jest.spyOn(client, 'post') as jest.SpiedFunction<typeof client.post>;

afterAll(() => {
    postSpy.mockRestore();
});

// ─── 纯函数测试 ───────────────────────────────────────────

describe('isIdPath', () => {
    it('should accept single-level ID path', () => {
        expect(isIdPath('/20210917220500-sz588nq.sy')).toBe(true);
    });

    it('should accept nested ID path', () => {
        expect(isIdPath('/20210917220500-sz588nq/20210917220056-yxtyl7i.sy')).toBe(true);
    });

    it('should reject hpath with Chinese characters', () => {
        expect(isIdPath('/类阈限')).toBe(false);
    });

    it('should reject hpath with spaces', () => {
        expect(isIdPath('/daily exp/My Document')).toBe(false);
    });

    it('should reject empty string', () => {
        expect(isIdPath('')).toBe(false);
    });

    it('should reject single slash', () => {
        expect(isIdPath('/')).toBe(false);
    });

    it('should reject ID-like path without .sy extension', () => {
        expect(isIdPath('/20210917220500-sz588nq')).toBe(false);
    });

    it('should reject path with uppercase in ID segment', () => {
        expect(isIdPath('/20210917220500-SZ588NQ.sy')).toBe(false);
    });

    it('should reject path with wrong timestamp length', () => {
        expect(isIdPath('/2021091722050-sz588nq.sy')).toBe(false);
        expect(isIdPath('/202109172205000-sz588nq.sy')).toBe(false);
    });

    it('should reject path with wrong ID segment length', () => {
        expect(isIdPath('/20210917220500-sz588n.sy')).toBe(false);
        expect(isIdPath('/20210917220500-sz588nqa.sy')).toBe(false);
    });
});

describe('isHPath', () => {
    it('should return true for human-readable paths', () => {
        expect(isHPath('/foo/bar')).toBe(true);
        expect(isHPath('/daily exp/My Document')).toBe(true);
        expect(isHPath('/类阈限')).toBe(true);
    });

    it('should return false for ID paths', () => {
        expect(isHPath('/20210917220500-sz588nq.sy')).toBe(false);
    });

    it('should be the inverse of isIdPath', () => {
        const paths = [
            '/20210917220500-sz588nq.sy',
            '/20210917220500-sz588nq/20210917220056-yxtyl7i.sy',
            '/foo/bar',
            '/类阈限',
            '',
            '/',
        ];
        for (const p of paths) {
            expect(isHPath(p)).toBe(!isIdPath(p));
        }
    });
});

// ─── API 调用测试 ─────────────────────────────────────────

beforeEach(() => {
    postSpy.mockReset();
});

describe('resolveHPathToIDs', () => {
    it('should return IDs from API response', async () => {
        postSpy.mockResolvedValueOnce({
            code: 0,
            msg: '',
            data: ['20200813004931-q4cu8na'],
        });

        const ids = await resolveHPathToIDs('20210808180117-czj9bvb', '/foo/bar');
        expect(ids).toEqual(['20200813004931-q4cu8na']);
        expect(postSpy).toHaveBeenCalledWith('/api/filetree/getIDsByHPath', {
            notebook: '20210808180117-czj9bvb',
            path: '/foo/bar',
        });
    });

    it('should return multiple IDs when hpath matches multiple docs', async () => {
        postSpy.mockResolvedValueOnce({
            code: 0,
            msg: '',
            data: ['20200813004931-q4cu8na', '20210917220056-yxtyl7i'],
        });

        const ids = await resolveHPathToIDs('nb-id', '/duplicate/path');
        expect(ids).toHaveLength(2);
    });

    it('should throw when API returns empty array', async () => {
        postSpy.mockResolvedValueOnce({ code: 0, msg: '', data: [] });

        await expect(resolveHPathToIDs('nb-id', '/nonexistent')).rejects.toThrow(
            'Cannot resolve hpath "/nonexistent"'
        );
    });

    it('should throw when API returns non-array', async () => {
        postSpy.mockResolvedValueOnce({ code: 0, msg: '', data: null });

        await expect(resolveHPathToIDs('nb-id', '/bad')).rejects.toThrow(
            'Cannot resolve hpath "/bad"'
        );
    });
});

describe('getPathByID', () => {
    it('should return notebook and path from API', async () => {
        postSpy.mockResolvedValueOnce({
            code: 0,
            msg: '',
            data: {
                notebook: '20210808180117-czj9bvb',
                path: '/20200812220555-lj3enxa/20210808180320-fqgskfj.sy',
            },
        });

        const result = await getPathByID('20210808180320-fqgskfj');
        expect(result).toEqual({
            notebook: '20210808180117-czj9bvb',
            path: '/20200812220555-lj3enxa/20210808180320-fqgskfj.sy',
        });
        expect(postSpy).toHaveBeenCalledWith('/api/filetree/getPathByID', {
            id: '20210808180320-fqgskfj',
        });
    });
});

describe('resolveToIdPath', () => {
    it('should return ID path as-is without API call', async () => {
        const idPath = '/20210917220500-sz588nq/20210917220056-yxtyl7i.sy';
        const result = await resolveToIdPath('nb-id', idPath);
        expect(result).toBe(idPath);
        expect(postSpy).not.toHaveBeenCalled();
    });

    it('should resolve hpath via getIDsByHPath + getPathByID', async () => {
        postSpy
            .mockResolvedValueOnce({ code: 0, msg: '', data: ['20200813004931-q4cu8na'] })
            .mockResolvedValueOnce({
                code: 0,
                msg: '',
                data: {
                    notebook: '20210808180117-czj9bvb',
                    path: '/20200812220555-lj3enxa/20200813004931-q4cu8na.sy',
                },
            });

        const result = await resolveToIdPath('20210808180117-czj9bvb', '/foo/bar');
        expect(result).toBe('/20200812220555-lj3enxa/20200813004931-q4cu8na.sy');
        expect(postSpy).toHaveBeenCalledTimes(2);
    });
});
