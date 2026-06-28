import { z } from 'zod';
import { createHandler } from '../../utils/client.js';
import { registry } from '../../utils/registry.js';
import { CommandHandler } from '../../utils/registry.js';

const namespace = 'query';

// SQL query
const sqlHandler: CommandHandler = {
    namespace,
    name: 'sql',
    description: 'Execute SQL query',
    params: z.object({
        stmt: z.string().describe('SQL statement')
    }),
    handler: createHandler('/api/query/sql'),
    documentation: {
        description: 'Execute SQL query',
        params: {
            stmt: {
                type: 'string',
                description: 'SQL statement',
                required: true
            }
        },
        returns: {
            type: 'object',
            description: 'Query results',
            properties: {
                data: 'Array of result rows'
            }
        },
        examples: [
            {
                description: 'This example demonstrates querying paragraph blocks with a limit of 7 results, showing how to use SQL to retrieve specific block types from the database.',
                params: {
                    stmt: "SELECT * FROM blocks WHERE type = 'p' LIMIT 7"
                },
                response: {
                    data: [
                        {
                            id: "20200812220555-lj3enxa",
                            content: "Block content"
                        }
                    ]
                }
            }
        ],
        apiLink: 'https://github.com/siyuan-note/siyuan/blob/master/API.md#sql-query'
    }
};

// Block query — 使用官方 getBlockAttrs API
const blockHandler: CommandHandler = {
    namespace,
    name: 'block',
    description: 'Get block attributes by ID',
    params: z.object({
        id: z.string().describe('Block ID')
    }),
    handler: createHandler('/api/attr/getBlockAttrs'),
    documentation: {
        description: 'Get block attributes and metadata. Official endpoint: /api/attr/getBlockAttrs',
        params: {
            id: { type: 'string', description: 'Block ID', required: true }
        },
        returns: {
            type: 'object',
            description: 'Block info including id, type, title, updated, and custom attrs',
            properties: { id: 'Block ID', type: 'Block type', title: 'Block title' }
        },
        examples: [{
            description: 'Get block attributes',
            params: { id: "20200812220555-lj3enxa" },
            response: { id: "20200812220555-lj3enxa", type: "doc", title: "My Doc" }
        }],
        apiLink: 'https://github.com/siyuan-note/siyuan/blob/master/API_zh_CN.md#获取块属性'
    }
};

// Register all query related commands
export function registerQueryHandlers() {
    registry.registerCommand(sqlHandler);
    registry.registerCommand(blockHandler);
} 