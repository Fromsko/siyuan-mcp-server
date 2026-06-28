import { z } from 'zod';
import { createHandler } from '../../utils/client.js';
import { registry } from '../../utils/registry.js';
import { CommandHandler } from '../../utils/registry.js';

const namespace = 'export';

// Export notebook
const exportNotebookHandler: CommandHandler = {
    namespace,
    name: 'exportNotebook',
    description: 'Export notebook as Markdown ZIP archive (via exportResources)',
    params: z.object({
        paths: z.array(z.string()).describe('File or directory paths to export relative to workspace'),
        name: z.string().optional().describe('Export file name (without .zip)')
    }),
    handler: createHandler('/api/export/exportResources'),
    documentation: {
        description: 'Export notebook files as a ZIP archive. Official endpoint: /api/export/exportResources',
        params: {
            paths: {
                type: 'array',
                description: 'File or folder paths to export',
                required: true
            },
            name: {
                type: 'string',
                description: 'Export zip filename (without extension)',
                required: false
            }
        },
        returns: {
            type: 'object',
            description: 'Export result with zip path',
            properties: { path: 'Path to created .zip file' }
        },
        examples: [{
            description: 'Export notebook content as zip archive',
            params: { paths: ["/20210817205410-2kvfpfn"], name: "my-notebook" },
            response: { path: "temp/export/my-notebook.zip" }
        }],
        apiLink: 'https://github.com/siyuan-note/siyuan/blob/master/API_zh_CN.md#导出文件与目录'
    }
};

// Export document as Markdown
const exportDocHandler: CommandHandler = {
    namespace,
    name: 'exportDoc',
    description: 'Export document as Markdown text',
    params: z.object({
        id: z.string().describe('Document block ID to export')
    }),
    handler: createHandler('/api/export/exportMdContent'),
    documentation: {
        description: 'Export document content as Markdown. Official endpoint: /api/export/exportMdContent',
        params: {
            id: { type: 'string', description: 'Document block ID', required: true }
        },
        returns: {
            type: 'object',
            description: 'Exported content',
            properties: { hPath: 'Human readable path', content: 'Markdown content' }
        },
        examples: [{
            description: 'Export a document as Markdown text',
            params: { id: "20210817205410-2kvfpfn" },
            response: { hPath: "/foo/bar", content: "# Title\n\nContent..." }
        }],
        apiLink: 'https://github.com/siyuan-note/siyuan/blob/master/API_zh_CN.md#导出-markdown-文本'
    }
};

// Register all export related commands
export function registerExportHandlers() {
    registry.registerCommand(exportNotebookHandler);
    registry.registerCommand(exportDocHandler);
} 