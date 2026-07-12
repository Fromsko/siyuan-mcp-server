import { z } from 'zod';
import { registry } from '../../utils/registry.js';
import { client } from '../../utils/client.js';
import { CommandHandler } from '../../utils/registry.js';

const namespace = 'search';

/**
 * Escape a string for safe use in SiYuan SQL LIKE queries.
 * SiYuan uses SQLite internally — single quotes are the main injection vector.
 */
function escapeSqlLike(value: string): string {
    return value.replace(/'/g, "''");
}

/**
 * Known SiYuan block types for validation.
 */
const VALID_BLOCK_TYPES: Record<string, true> = {
    doc: true, h: true, p: true, code: true, blockquote: true, super: true, iframe: true,
    query_embed: true, video: true, audio: true, table: true, task: true, li: true, l: true,
    b: true, s: true, u: true, em: true, strong: true, mark: true, sup: true, sub: true, kbd: true,
    span: true, a: true, 'inline-math': true, 'inline-memo': true, text: true, 'html-block': true,
};

function sanitizeTypes(types: string[]): string[] {
    return types.filter(t => t in VALID_BLOCK_TYPES);
}

// Full text search — uses SQL LIKE (official API has no /api/search endpoint)
const fullTextSearchHandler: CommandHandler = {
    namespace,
    name: 'fullTextSearch',
    description: 'Full text search via SQL (official API has no /api/search endpoint)',
    params: z.object({
        query: z.string().describe('Search keyword'),
        types: z.array(z.string()).optional().describe('Block types filter (e.g. ["doc", "h"])'),
        limit: z.number().optional().default(32).describe('Max results')
    }),
    handler: async (params: unknown): Promise<{ content: Array<{ type: string; text: string }> }> => {
        const { query, types, limit = 32 } = params as { query: string; types?: string[]; limit?: number };
        const safeQuery = escapeSqlLike(query);
        const safeLimit = Math.max(1, Math.min(1000, Math.floor(limit)));

        let typesFilter = '';
        if (types?.length) {
            const validTypes = sanitizeTypes(types);
            if (validTypes.length === 0) {
                return {
                    content: [{
                        type: 'text',
                        text: JSON.stringify({ code: -1, msg: 'No valid block types provided', data: null })
                    }]
                };
            }
            const escaped = validTypes.map(t => `'${escapeSqlLike(t)}'`).join(',');
            typesFilter = `AND type IN (${escaped})`;
        }

        const stmt = `SELECT * FROM blocks WHERE content LIKE '%${safeQuery}%' ${typesFilter} LIMIT ${safeLimit}`;
        const response = await client.post('/api/query/sql', { stmt });
        return {
            content: [{
                type: 'text',
                text: JSON.stringify(response.data ?? response)
            }]
        };
    },
    documentation: {
        description: 'Search notes by keyword using SQL LIKE query (official SiYuan API has no dedicated search endpoint)',
        params: {
            query: { type: 'string', description: 'Search keyword', required: true },
            types: { type: 'array', description: 'Block type filter (validated against known types)', required: false },
            limit: { type: 'number', description: 'Max results (default 32, max 1000)', required: false }
        },
        returns: {
            type: 'object',
            description: 'Matching blocks',
            properties: { data: 'Array of matching block rows' }
        },
        examples: [{
            description: 'Search blocks containing "keyword"',
            params: { query: 'keyword', types: ['doc', 'h'], limit: 10 },
            response: { data: [{ id: '20200812220555-lj3enxa', content: 'Block with keyword' }] }
        }],
        apiLink: 'https://github.com/siyuan-note/siyuan/blob/master/API.md#execute-sql-query'
    }
};

// Register all search related commands
export function registerSearchHandlers() {
    registry.registerCommand(fullTextSearchHandler);
}
