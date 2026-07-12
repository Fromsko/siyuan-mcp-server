import { z } from 'zod';
import { createHandler } from '../../utils/client.js';
import { registry } from '../../utils/registry.js';
import { CommandHandler } from '../../utils/registry.js';

const namespace = 'block';

// Insert block
const insertBlockHandler: CommandHandler = {
    namespace,
    name: 'insertBlock',
    description: 'Insert a block',
    params: z.object({
        data: z.string().describe('Block content in Markdown format'),
        dataType: z.enum(['markdown', 'dom']).describe('Content type'),
        previousID: z.string().optional().describe('Previous block ID'),
        parentID: z.string().optional().describe('Parent block ID')
    }),
    handler: createHandler('/api/block/insertBlock'),
    documentation: {
        description: 'Insert a block',
        params: {
            data: {
                type: 'string',
                description: 'Block content in Markdown format',
                required: true
            },
            dataType: {
                type: 'string',
                description: 'Content type: markdown or dom',
                required: true
            },
            previousID: {
                type: 'string',
                description: 'Previous block ID',
                required: false
            },
            parentID: {
                type: 'string',
                description: 'Parent block ID',
                required: false
            }
        },
        returns: {
            type: 'object',
            description: 'Operation result',
            properties: {
                doOperations: 'Array of operations performed'
            }
        },
        examples: [
            {
                description: 'This example demonstrates inserting a new block with markdown content after a specific block and under a parent block, showing the hierarchical block structure manipulation.',
                params: {
                    data: "New block content",
                    dataType: "markdown",
                    previousID: "20200812220555-lj3enxa",
                    parentID: "20200812220555-lj3enxa"
                },
                response: {
                    doOperations: [
                        {
                            action: "insert",
                            data: "New block content",
                            id: "20200812220555-lj3enxa"
                        }
                    ]
                }
            }
        ],
        apiLink: 'https://github.com/siyuan-note/siyuan/blob/master/API.md#insert-block'
    }
};

// Update block
const updateBlockHandler: CommandHandler = {
    namespace,
    name: 'updateBlock',
    description: 'Update block content',
    params: z.object({
        data: z.string().describe('Block content in Markdown format'),
        dataType: z.enum(['markdown', 'dom']).describe('Content type'),
        id: z.string().describe('Block ID')
    }),
    handler: createHandler('/api/block/updateBlock'),
    documentation: {
        description: 'Update block content',
        params: {
            data: {
                type: 'string',
                description: 'Block content in Markdown format',
                required: true
            },
            dataType: {
                type: 'string',
                description: 'Content type: markdown or dom',
                required: true
            },
            id: {
                type: 'string',
                description: 'Block ID',
                required: true
            }
        },
        returns: {
            type: 'object',
            description: 'Operation result',
            properties: {
                doOperations: 'Array of operations performed'
            }
        },
        examples: [
            {
                description: 'This example shows how to update the content of an existing block identified by its ID, converting the new content from markdown format.',
                params: {
                    data: "Updated content",
                    dataType: "markdown",
                    id: "20200812220555-lj3enxa"
                },
                response: {
                    doOperations: [
                        {
                            action: "update",
                            data: "Updated content",
                            id: "20200812220555-lj3enxa"
                        }
                    ]
                }
            }
        ],
        apiLink: 'https://github.com/siyuan-note/siyuan/blob/master/API.md#update-block'
    }
};

// Delete block
const deleteBlockHandler: CommandHandler = {
    namespace,
    name: 'deleteBlock',
    description: 'Delete a block',
    params: z.object({
        id: z.string().describe('Block ID')
    }),
    handler: createHandler('/api/block/deleteBlock'),
    documentation: {
        description: 'Delete a block',
        params: {
            id: {
                type: 'string',
                description: 'Block ID',
                required: true
            }
        },
        returns: {
            type: 'object',
            description: 'Operation result',
            properties: {
                doOperations: 'Array of operations performed'
            }
        },
        examples: [
            {
                description: 'This example demonstrates how to permanently remove a block from the document structure using its unique identifier.',
                params: {
                    id: "20200812220555-lj3enxa"
                },
                response: {
                    doOperations: [
                        {
                            action: "delete",
                            id: "20200812220555-lj3enxa"
                        }
                    ]
                }
            }
        ],
        apiLink: 'https://github.com/siyuan-note/siyuan/blob/master/API.md#delete-block'
    }
};

// Move block
const moveBlockHandler: CommandHandler = {
    namespace,
    name: 'moveBlock',
    description: 'Move a block',
    params: z.object({
        id: z.string().describe('Block ID to move'),
        previousID: z.string().optional().describe('Previous block ID'),
        parentID: z.string().optional().describe('Parent block ID')
    }),
    handler: createHandler('/api/block/moveBlock'),
    documentation: {
        description: 'Move a block',
        params: {
            id: {
                type: 'string',
                description: 'Block ID to move',
                required: true
            },
            previousID: {
                type: 'string',
                description: 'Previous block ID',
                required: false
            },
            parentID: {
                type: 'string',
                description: 'Parent block ID',
                required: false
            }
        },
        returns: {
            type: 'object',
            description: 'Operation result',
            properties: {
                doOperations: 'Array of operations performed'
            }
        },
        examples: [
            {
                description: 'This example shows how to relocate a block within the document structure by specifying its new position relative to other blocks.',
                params: {
                    id: "20200812220555-lj3enxa",
                    previousID: "20200812220555-lj3enxa",
                    parentID: "20200812220555-lj3enxa"
                },
                response: {
                    doOperations: [
                        {
                            action: "move",
                            id: "20200812220555-lj3enxa",
                            previousID: "20200812220555-lj3enxa",
                            parentID: "20200812220555-lj3enxa"
                        }
                    ]
                }
            }
        ],
        apiLink: 'https://github.com/siyuan-note/siyuan/blob/master/API.md#move-block'
    }
};

// Get block Kramdown
const getBlockKramdownHandler: CommandHandler = {
    namespace,
    name: 'getBlockKramdown',
    description: 'Get block Kramdown content',
    params: z.object({
        id: z.string().describe('Block ID')
    }),
    handler: createHandler('/api/block/getBlockKramdown'),
    documentation: {
        description: 'Get block Kramdown content',
        params: {
            id: {
                type: 'string',
                description: 'Block ID',
                required: true
            }
        },
        returns: {
            type: 'object',
            description: 'Block Kramdown content',
            properties: {
                id: 'Block ID',
                kramdown: 'Block content in Kramdown format'
            }
        },
        examples: [
            {
                description: 'This example retrieves the Kramdown-formatted content of a specific block, useful for advanced markdown processing or external integrations.',
                params: {
                    id: "20200812220555-lj3enxa"
                },
                response: {
                    id: "20200812220555-lj3enxa",
                    kramdown: "## Block content"
                }
            }
        ],
        apiLink: 'https://github.com/siyuan-note/siyuan/blob/master/API.md#get-block-kramdown'
    }
};

// Prepend block
const prependBlockHandler: CommandHandler = {
    namespace,
    name: 'prependBlock',
    description: 'Prepend a block to the beginning of a parent block',
    params: z.object({
        data: z.string().describe('Block content'),
        dataType: z.enum(['markdown', 'dom']).describe('Data type: markdown or dom'),
        parentID: z.string().describe('Parent block ID')
    }),
    handler: createHandler('/api/block/prependBlock'),
    documentation: {
        description: 'Prepend a block to the beginning of a parent block',
        params: {
            data: { type: 'string', description: 'Block content', required: true },
            dataType: { type: 'string', description: 'Data type: markdown or dom', required: true },
            parentID: { type: 'string', description: 'Parent block ID', required: true }
        },
        returns: { type: 'object', description: 'Operation result with new block ID', properties: {} },
        examples: [{
            description: 'Prepend a paragraph to a document',
            params: { data: 'Hello world', dataType: 'markdown', parentID: '20220107173950-7f9m1nb' },
            response: {}
        }],
        apiLink: 'https://github.com/siyuan-note/siyuan/blob/master/API.md#prepend-blocks'
    }
};

// Append block
const appendBlockHandler: CommandHandler = {
    namespace,
    name: 'appendBlock',
    description: 'Append a block to the end of a parent block',
    params: z.object({
        data: z.string().describe('Block content'),
        dataType: z.enum(['markdown', 'dom']).describe('Data type: markdown or dom'),
        parentID: z.string().describe('Parent block ID')
    }),
    handler: createHandler('/api/block/appendBlock'),
    documentation: {
        description: 'Append a block to the end of a parent block',
        params: {
            data: { type: 'string', description: 'Block content', required: true },
            dataType: { type: 'string', description: 'Data type: markdown or dom', required: true },
            parentID: { type: 'string', description: 'Parent block ID', required: true }
        },
        returns: { type: 'object', description: 'Operation result with new block ID', properties: {} },
        examples: [{
            description: 'Append a paragraph to a document',
            params: { data: 'Footer text', dataType: 'markdown', parentID: '20220107173950-7f9m1nb' },
            response: {}
        }],
        apiLink: 'https://github.com/siyuan-note/siyuan/blob/master/API.md#append-blocks'
    }
};

// Fold block
const foldBlockHandler: CommandHandler = {
    namespace,
    name: 'foldBlock',
    description: 'Fold a block (collapse)',
    params: z.object({
        id: z.string().describe('Block ID to fold')
    }),
    handler: createHandler('/api/block/foldBlock'),
    documentation: {
        description: 'Fold (collapse) a block',
        params: {
            id: { type: 'string', description: 'Block ID to fold', required: true }
        },
        returns: { type: 'object', description: 'Operation result', properties: {} },
        examples: [{
            description: 'Fold a heading block',
            params: { id: '20231224160424-2f5680o' },
            response: {}
        }],
        apiLink: 'https://github.com/siyuan-note/siyuan/blob/master/API.md#fold-a-block'
    }
};

// Unfold block
const unfoldBlockHandler: CommandHandler = {
    namespace,
    name: 'unfoldBlock',
    description: 'Unfold a block (expand)',
    params: z.object({
        id: z.string().describe('Block ID to unfold')
    }),
    handler: createHandler('/api/block/unfoldBlock'),
    documentation: {
        description: 'Unfold (expand) a block',
        params: {
            id: { type: 'string', description: 'Block ID to unfold', required: true }
        },
        returns: { type: 'object', description: 'Operation result', properties: {} },
        examples: [{
            description: 'Unfold a heading block',
            params: { id: '20231224160424-2f5680o' },
            response: {}
        }],
        apiLink: 'https://github.com/siyuan-note/siyuan/blob/master/API.md#unfold-a-block'
    }
};

// Get child blocks
const getChildBlocksHandler: CommandHandler = {
    namespace,
    name: 'getChildBlocks',
    description: 'Get child blocks of a parent block',
    params: z.object({
        id: z.string().describe('Parent block ID')
    }),
    handler: createHandler('/api/block/getChildBlocks'),
    documentation: {
        description: 'Get child blocks of a parent block. Blocks under a heading are also counted as children.',
        params: {
            id: { type: 'string', description: 'Parent block ID', required: true }
        },
        returns: { type: 'object', description: 'Array of child blocks with id, type, subType', properties: {} },
        examples: [{
            description: 'Get children of a document block',
            params: { id: '20230506212712-vt9ajwj' },
            response: { data: [{ id: '20230512083858-mjdwkbn', type: 'h', subType: 'h1' }] }
        }],
        apiLink: 'https://github.com/siyuan-note/siyuan/blob/master/API.md#get-child-blocks'
    }
};

// Transfer block ref
const transferBlockRefHandler: CommandHandler = {
    namespace,
    name: 'transferBlockRef',
    description: 'Transfer block references from one block to another',
    params: z.object({
        fromID: z.string().describe('Source block ID (the definition block)'),
        toID: z.string().describe('Target block ID'),
        refIDs: z.array(z.string()).optional().describe('Specific ref block IDs to transfer. If omitted, all refs are transferred.')
    }),
    handler: createHandler('/api/block/transferBlockRef'),
    documentation: {
        description: 'Transfer block references from one block to another',
        params: {
            fromID: { type: 'string', description: 'Source block ID', required: true },
            toID: { type: 'string', description: 'Target block ID', required: true },
            refIDs: { type: 'array', description: 'Specific ref IDs to transfer (optional, transfers all if omitted)', required: false }
        },
        returns: { type: 'object', description: 'Operation result', properties: {} },
        examples: [{
            description: 'Transfer all refs from one block to another',
            params: { fromID: '20230612160235-mv6rrh1', toID: '20230613093045-uwcomng' },
            response: {}
        }],
        apiLink: 'https://github.com/siyuan-note/siyuan/blob/master/API.md#transfer-block-ref'
    }
};

// Register all block related commands
export function registerBlockHandlers() {
    registry.registerCommand(insertBlockHandler);
    registry.registerCommand(updateBlockHandler);
    registry.registerCommand(deleteBlockHandler);
    registry.registerCommand(moveBlockHandler);
    registry.registerCommand(getBlockKramdownHandler);
    registry.registerCommand(prependBlockHandler);
    registry.registerCommand(appendBlockHandler);
    registry.registerCommand(foldBlockHandler);
    registry.registerCommand(unfoldBlockHandler);
    registry.registerCommand(getChildBlocksHandler);
    registry.registerCommand(transferBlockRefHandler);
}