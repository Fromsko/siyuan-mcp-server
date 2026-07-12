import { z } from 'zod';
import { createHandler, client } from '../../utils/client.js';
import { registry } from '../../utils/registry.js';
import { CommandHandler } from '../../utils/registry.js';
import { isIdPath, resolveHPathToIDs, getPathByID } from '../../utils/path-resolver.js';

const namespace = 'filetree';

// Create document with Markdown (accepts hpath — official API behavior)
const createDocWithMdHandler: CommandHandler = {
    namespace,
    name: 'createDocWithMd',
    description: 'Create a document with Markdown content',
    params: z.object({
        notebook: z.string().describe('Notebook ID'),
        path: z.string().describe('Document path (hpath, e.g. /foo/bar)'),
        markdown: z.string().describe('GFM Markdown content')
    }),
    handler: createHandler('/api/filetree/createDocWithMd'),
    documentation: {
        description: 'Create a document with Markdown content. The path is a human-readable path (hpath).',
        params: {
            notebook: { type: 'string', description: 'Notebook ID', required: true },
            path: { type: 'string', description: 'Document hpath (e.g. /foo/bar)', required: true },
            markdown: { type: 'string', description: 'GFM Markdown content', required: true }
        },
        returns: { type: 'object', description: 'Created document ID', properties: {} },
        examples: [{
            description: 'Create a document under /foo/bar in a notebook',
            params: { notebook: '20210817205410-2kvfpfn', path: '/foo/bar', markdown: '# Hello' },
            response: { data: '20210914223645-oj2vnx2' }
        }],
        apiLink: 'https://github.com/siyuan-note/siyuan/blob/master/API.md#create-document-with-markdown'
    }
};

// Rename document — auto-resolves hpath to ID path
const renameDocHandler: CommandHandler = {
    namespace,
    name: 'renameDoc',
    description: 'Rename a document',
    params: z.object({
        notebook: z.string().describe('Notebook ID'),
        path: z.string().describe('Document path (ID path or hpath)'),
        title: z.string().describe('New document title')
    }),
    handler: async (params: unknown): Promise<{ content: Array<{ type: string; text: string }> }> => {
        const { notebook, path, title } = params as { notebook: string; path: string; title: string };
        if (isIdPath(path)) {
            const response = await client.post('/api/filetree/renameDoc', { notebook, path, title });
            return { content: [{ type: 'text', text: JSON.stringify(response.data) }] };
        }
        // hpath: resolve to ID, use renameDocByID
        const ids = await resolveHPathToIDs(notebook, path);
        const response = await client.post('/api/filetree/renameDocByID', { id: ids[0], title });
        return { content: [{ type: 'text', text: JSON.stringify(response.data) }] };
    },
    documentation: {
        description: 'Rename a document. Accepts both ID path and human-readable path (hpath).',
        params: {
            notebook: { type: 'string', description: 'Notebook ID', required: true },
            path: { type: 'string', description: 'Document path (ID path or hpath)', required: true },
            title: { type: 'string', description: 'New document title', required: true }
        },
        returns: { type: 'object', description: 'Operation result', properties: {} },
        examples: [{
            description: 'Rename a document using hpath',
            params: { notebook: '20210817205410-2kvfpfn', path: '/test/doc', title: 'New Title' },
            response: {}
        }],
        apiLink: 'https://github.com/siyuan-note/siyuan/blob/master/API.md#rename-document'
    }
};

// Remove document — auto-resolves hpath to ID path
const removeDocHandler: CommandHandler = {
    namespace,
    name: 'removeDoc',
    description: 'Remove a document',
    params: z.object({
        notebook: z.string().describe('Notebook ID'),
        path: z.string().describe('Document path (ID path or hpath)')
    }),
    handler: async (params: unknown): Promise<{ content: Array<{ type: string; text: string }> }> => {
        const { notebook, path } = params as { notebook: string; path: string };
        if (isIdPath(path)) {
            const response = await client.post('/api/filetree/removeDoc', { notebook, path });
            return { content: [{ type: 'text', text: JSON.stringify(response.data) }] };
        }
        // hpath: resolve to ID, use removeDocByID
        const ids = await resolveHPathToIDs(notebook, path);
        const response = await client.post('/api/filetree/removeDocByID', { id: ids[0] });
        return { content: [{ type: 'text', text: JSON.stringify(response.data) }] };
    },
    documentation: {
        description: 'Remove a document. Accepts both ID path and human-readable path (hpath).',
        params: {
            notebook: { type: 'string', description: 'Notebook ID', required: true },
            path: { type: 'string', description: 'Document path (ID path or hpath)', required: true }
        },
        returns: { type: 'object', description: 'Operation result', properties: {} },
        examples: [{
            description: 'Remove a document using hpath',
            params: { notebook: '20210817205410-2kvfpfn', path: '/test/doc' },
            response: {}
        }],
        apiLink: 'https://github.com/siyuan-note/siyuan/blob/master/API.md#remove-document'
    }
};

// Move documents — auto-resolves hpaths to ID paths
const moveDocsHandler: CommandHandler = {
    namespace,
    name: 'moveDocs',
    description: 'Move documents',
    params: z.object({
        fromPaths: z.array(z.string()).describe('Source document paths (ID paths or hpaths)'),
        toNotebook: z.string().describe('Target notebook ID'),
        toPath: z.string().describe('Target document path (ID path or hpath)')
    }),
    handler: async (params: unknown): Promise<{ content: Array<{ type: string; text: string }> }> => {
        const { fromPaths, toNotebook, toPath } = params as {
            fromPaths: string[];
            toNotebook: string;
            toPath: string;
        };

        const needsResolve = fromPaths.some(p => !isIdPath(p)) || !isIdPath(toPath);
        if (!needsResolve) {
            const response = await client.post('/api/filetree/moveDocs', {
                fromPaths, toNotebook, toPath,
            });
            return { content: [{ type: 'text', text: JSON.stringify(response.data) }] };
        }

        // Resolve hpaths to IDs, use moveDocsByID
        const fromIDs: string[] = [];
        for (const p of fromPaths) {
            if (isIdPath(p)) {
                // Extract doc ID from ID path (last segment without .sy)
                const segments = p.split('/');
                const last = segments[segments.length - 1];
                fromIDs.push(last.replace('.sy', ''));
            } else {
                const ids = await resolveHPathToIDs(toNotebook, p);
                fromIDs.push(ids[0]);
            }
        }

        // Resolve target: if hpath, get its doc ID as the parent
        let toID: string;
        if (isIdPath(toPath)) {
            const segments = toPath.split('/');
            const last = segments[segments.length - 1];
            toID = last.replace('.sy', '');
        } else {
            const ids = await resolveHPathToIDs(toNotebook, toPath);
            toID = ids[0];
        }

        const response = await client.post('/api/filetree/moveDocsByID', { fromIDs, toID });
        return { content: [{ type: 'text', text: JSON.stringify(response.data) }] };
    },
    documentation: {
        description: 'Move documents. Accepts both ID paths and human-readable paths (hpaths).',
        params: {
            fromPaths: { type: 'array', description: 'Source document paths (ID paths or hpaths)', required: true },
            toNotebook: { type: 'string', description: 'Target notebook ID', required: true },
            toPath: { type: 'string', description: 'Target document path (ID path or hpath)', required: true }
        },
        returns: { type: 'object', description: 'Operation result', properties: {} },
        examples: [{
            description: 'Move documents using hpaths',
            params: {
                fromPaths: ['/test/doc1', '/test/doc2'],
                toNotebook: '20210817205410-2kvfpfn',
                toPath: '/target/path'
            },
            response: {}
        }],
        apiLink: 'https://github.com/siyuan-note/siyuan/blob/master/API.md#move-documents'
    }
};

// Get document HPath by path (ID path → hpath)
const getHPathByPathHandler: CommandHandler = {
    namespace,
    name: 'getHPathByPath',
    description: 'Get human-readable path from document ID path',
    params: z.object({
        notebook: z.string().describe('Notebook ID'),
        path: z.string().describe('Document ID path (e.g. /20210917220500-sz588nq/20210917220056-yxtyl7i.sy)')
    }),
    handler: createHandler('/api/filetree/getHPathByPath'),
    documentation: {
        description: 'Get human-readable path from document ID path',
        params: {
            notebook: { type: 'string', description: 'Notebook ID', required: true },
            path: { type: 'string', description: 'Document ID path', required: true }
        },
        returns: { type: 'object', description: 'Human-readable path', properties: { hPath: 'Document HPath' } },
        examples: [{
            description: 'Get hpath from ID path',
            params: { notebook: '20210817205410-2kvfpfn', path: '/20210917220500-sz588nq/20210917220056-yxtyl7i.sy' },
            response: { hPath: '/Test/Doc' }
        }],
        apiLink: 'https://github.com/siyuan-note/siyuan/blob/master/API.md#get-human-readable-path-based-on-path'
    }
};

// Get document HPath by ID (block ID → hpath)
const getHPathByIDHandler: CommandHandler = {
    namespace,
    name: 'getHPathByID',
    description: 'Get human-readable path from block ID',
    params: z.object({
        id: z.string().describe('Block ID')
    }),
    handler: createHandler('/api/filetree/getHPathByID'),
    documentation: {
        description: 'Get human-readable path from block ID',
        params: {
            id: { type: 'string', description: 'Block ID', required: true }
        },
        returns: { type: 'object', description: 'Human-readable path', properties: { hPath: 'Document HPath' } },
        examples: [{
            description: 'Get hpath from block ID',
            params: { id: '20210917220056-yxtyl7i' },
            response: { hPath: '/Test/Doc' }
        }],
        apiLink: 'https://github.com/siyuan-note/siyuan/blob/master/API.md#get-human-readable-path-based-on-id'
    }
};

// Get storage path (ID path) from block ID
const getPathByIDHandler: CommandHandler = {
    namespace,
    name: 'getPathByID',
    description: 'Get storage path (ID path) and notebook from block ID',
    params: z.object({
        id: z.string().describe('Block ID')
    }),
    handler: createHandler('/api/filetree/getPathByID'),
    documentation: {
        description: 'Get storage path (ID path) and notebook from block ID',
        params: {
            id: { type: 'string', description: 'Block ID', required: true }
        },
        returns: {
            type: 'object',
            description: 'Storage path info',
            properties: { notebook: 'Notebook ID', path: 'ID path (e.g. /20210917220500-sz588nq/20210917220056-yxtyl7i.sy)' }
        },
        examples: [{
            description: 'Get storage path from block ID',
            params: { id: '20210808180320-fqgskfj' },
            response: { notebook: '20210808180117-czj9bvb', path: '/20200812220555-lj3enxa/20210808180320-fqgskfj.sy' }
        }],
        apiLink: 'https://github.com/siyuan-note/siyuan/blob/master/API.md#get-storage-path-based-on-id'
    }
};

// Get document IDs from human-readable path
const getIDsByHPathHandler: CommandHandler = {
    namespace,
    name: 'getIDsByHPath',
    description: 'Get document IDs from human-readable path',
    params: z.object({
        notebook: z.string().describe('Notebook ID'),
        path: z.string().describe('Human-readable path (e.g. /foo/bar)')
    }),
    handler: createHandler('/api/filetree/getIDsByHPath'),
    documentation: {
        description: 'Get document IDs from human-readable path (hpath)',
        params: {
            notebook: { type: 'string', description: 'Notebook ID', required: true },
            path: { type: 'string', description: 'Human-readable path', required: true }
        },
        returns: { type: 'object', description: 'Array of document IDs', properties: {} },
        examples: [{
            description: 'Get document IDs from hpath',
            params: { notebook: '20210808180117-czj9bvb', path: '/foo/bar' },
            response: { data: ['20200813004931-q4cu8na'] }
        }],
        apiLink: 'https://github.com/siyuan-note/siyuan/blob/master/API.md#get-ids-based-on-human-readable-path'
    }
};

// Remove document by ID
const removeDocByIDHandler: CommandHandler = {
    namespace,
    name: 'removeDocByID',
    description: 'Remove a document by its ID',
    params: z.object({
        id: z.string().describe('Document ID')
    }),
    handler: createHandler('/api/filetree/removeDocByID'),
    documentation: {
        description: 'Remove a document by its ID (no notebook needed)',
        params: {
            id: { type: 'string', description: 'Document ID', required: true }
        },
        returns: { type: 'object', description: 'Operation result', properties: {} },
        examples: [{
            description: 'Remove a document by ID',
            params: { id: '20210902210113-0avi12f' },
            response: {}
        }],
        apiLink: 'https://github.com/siyuan-note/siyuan/blob/master/API.md#remove-document'
    }
};

// Rename document by ID
const renameDocByIDHandler: CommandHandler = {
    namespace,
    name: 'renameDocByID',
    description: 'Rename a document by its ID',
    params: z.object({
        id: z.string().describe('Document ID'),
        title: z.string().describe('New document title')
    }),
    handler: createHandler('/api/filetree/renameDocByID'),
    documentation: {
        description: 'Rename a document by its ID (no notebook needed)',
        params: {
            id: { type: 'string', description: 'Document ID', required: true },
            title: { type: 'string', description: 'New document title', required: true }
        },
        returns: { type: 'object', description: 'Operation result', properties: {} },
        examples: [{
            description: 'Rename a document by ID',
            params: { id: '20210902210113-0avi12f', title: 'New Title' },
            response: {}
        }],
        apiLink: 'https://github.com/siyuan-note/siyuan/blob/master/API.md#rename-document'
    }
};

// Move documents by ID
const moveDocsByIDHandler: CommandHandler = {
    namespace,
    name: 'moveDocsByID',
    description: 'Move documents by their IDs',
    params: z.object({
        fromIDs: z.array(z.string()).describe('Source document IDs'),
        toID: z.string().describe('Target parent document ID or notebook ID')
    }),
    handler: createHandler('/api/filetree/moveDocsByID'),
    documentation: {
        description: 'Move documents by their IDs (no path resolution needed)',
        params: {
            fromIDs: { type: 'array', description: 'Source document IDs', required: true },
            toID: { type: 'string', description: 'Target parent doc ID or notebook ID', required: true }
        },
        returns: { type: 'object', description: 'Operation result', properties: {} },
        examples: [{
            description: 'Move documents by ID',
            params: { fromIDs: ['20210917220056-yxtyl7i'], toID: '20210817205410-2kvfpfn' },
            response: {}
        }],
        apiLink: 'https://github.com/siyuan-note/siyuan/blob/master/API.md#move-documents'
    }
};

// Register all filetree related commands
export function registerFiletreeHandlers() {
    registry.registerCommand(createDocWithMdHandler);
    registry.registerCommand(renameDocHandler);
    registry.registerCommand(removeDocHandler);
    registry.registerCommand(moveDocsHandler);
    registry.registerCommand(getHPathByPathHandler);
    registry.registerCommand(getHPathByIDHandler);
    // New endpoints
    registry.registerCommand(getPathByIDHandler);
    registry.registerCommand(getIDsByHPathHandler);
    registry.registerCommand(removeDocByIDHandler);
    registry.registerCommand(renameDocByIDHandler);
    registry.registerCommand(moveDocsByIDHandler);
}
