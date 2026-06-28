import { z } from 'zod';
import { registry } from '../../utils/registry.js';
import { client } from '../../utils/client.js';
import { CommandHandler } from '../../utils/registry.js';

const namespace = 'search';

// Full text search — 使用 SQL LIKE 实现，因为官方 API 没有 /api/search/ 端点
const fullTextSearchHandler: CommandHandler = {
    namespace,
    name: 'fullTextSearch',
    description: 'Full text search via SQL (official API has no /api/search endpoint)',
    params: z.object({
        query: z.string().describe('Search keyword'),
        types: z.array(z.string()).optional().describe('Block types filter (e.g. ["doc", "h"])'),
        limit: z.number().optional().default(32).describe('Max results')
    }),
    handler: async (params: {
        query: string;
        types?: string[];
        limit?: number;
    }) => {
        const typesFilter = params.types?.length
            ? `AND type IN (${params.types.map(t => `'${t}'`).join(',')})`
            : '';
        const stmt = `SELECT * FROM blocks WHERE content LIKE '%${params.query}%' ${typesFilter} LIMIT ${params.limit || 32}`;

        const response = await client.post('/api/query/sql', { stmt });
        return {
            content: [{
                type: 'text' as const,
                text: JSON.stringify(response.data)
            }]
        };
    },
    documentation: {
        description: 'Search notes by keyword using SQL LIKE query (official SiYuan API has no dedicated search endpoint)',
        params: {
            query: { type: 'string', description: 'Search keyword', required: true },
            types: { type: 'array', description: 'Block type filter', required: false },
            limit: { type: 'number', description: 'Max results (default 32)', required: false }
        },
        returns: {
            type: 'object',
            description: 'Matching blocks',
            properties: {
                data: 'Array of matching block rows'
            }
        },
        examples: [{
            description: 'Search blocks containing "keyword"',
            params: { query: "keyword", types: ["doc", "h"], limit: 10 },
            response: { data: [{ id: "20200812220555-lj3enxa", content: "Block with keyword" }] }
        }],
        apiLink: 'https://github.com/siyuan-note/siyuan/blob/master/API_zh_CN.md#执行-sql-查询'
    }
};

// Register all search related commands
export function registerSearchHandlers() {
    registry.registerCommand(fullTextSearchHandler);
}
