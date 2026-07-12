import { z } from 'zod';
import { createHandler } from '../../utils/client.js';
import { registry } from '../../utils/registry.js';
import { CommandHandler } from '../../utils/registry.js';

const namespace = 'sql';

// Execute SQL query
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
                description: 'This example executes a SQL query to retrieve up to 7 paragraph blocks from the database, demonstrating basic block type filtering and result limiting.',
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
        apiLink: 'https://github.com/siyuan-note/siyuan/blob/master/API.md#execute-sql-query'
    }
};

// Flush transaction
const flushTransactionHandler: CommandHandler = {
    namespace,
    name: 'flushTransaction',
    description: 'Flush the transaction journal to the database',
    params: z.object({}),
    handler: createHandler('/api/sqlite/flushTransaction'),
    documentation: {
        description: 'Flush the transaction journal to the database. Useful after batch writes to ensure data persistence.',
        params: {},
        returns: { type: 'object', description: 'Operation result', properties: {} },
        examples: [{
            description: 'Flush pending transactions',
            params: {},
            response: {}
        }],
        apiLink: 'https://github.com/siyuan-note/siyuan/blob/master/API.md#flush-transaction'
    }
};

// Register all SQL related commands
export function registerSqlHandlers() {
    registry.registerCommand(sqlHandler);
    registry.registerCommand(flushTransactionHandler);
}