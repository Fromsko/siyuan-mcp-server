import { z } from 'zod';
import { createHandler } from '../../utils/client.js';
import { registry } from '../../utils/registry.js';
import { CommandHandler } from '../../utils/registry.js';

const namespace = 'file';

// Get file
const getFileHandler: CommandHandler = {
    namespace,
    name: 'getFile',
    description: 'Get file content',
    params: z.object({
        path: z.string().describe('File path')
    }),
    handler: createHandler('/api/file/getFile'),
    documentation: {
        description: 'Get file content',
        params: {
            path: {
                type: 'string',
                description: 'File path',
                required: true
            }
        },
        returns: {
            type: 'object',
            description: 'File content',
            properties: {
                isDir: 'Whether it is a directory',
                content: 'File content'
            }
        },
        examples: [
            {
                description: 'This example retrieves the content of a specific file from the data directory, indicating whether it is a directory and returning its contents.',
                params: {
                    path: "/data/20210808180117-6v0mkxr/20200923234011-ieuun1p.sy"
                },
                response: {
                    isDir: false,
                    content: "File content..."
                }
            }
        ],
        apiLink: 'https://github.com/siyuan-note/siyuan/blob/master/API.md#get-file'
    }
};

// Put file
const putFileHandler: CommandHandler = {
    namespace,
    name: 'putFile',
    description: 'Put file content',
    params: z.object({
        path: z.string().describe('File path'),
        file: z.any().describe('File content'),
        isDir: z.boolean().optional().describe('Whether it is a directory')
    }),
    handler: createHandler('/api/file/putFile'),
    documentation: {
        description: 'Put file content',
        params: {
            path: {
                type: 'string',
                description: 'File path',
                required: true
            },
            file: {
                type: 'any',
                description: 'File content',
                required: true
            },
            isDir: {
                type: 'boolean',
                description: 'Whether it is a directory',
                required: false
            }
        },
        returns: {
            type: 'object',
            description: 'Operation result',
            properties: {
                path: 'File path'
            }
        },
        examples: [
            {
                description: 'This example demonstrates writing new content to a file at the specified path, creating or updating the file as needed.',
                params: {
                    path: "/data/20210808180117-6v0mkxr/20200923234011-ieuun1p.sy",
                    file: "New file content"
                },
                response: {
                    path: "/data/20210808180117-6v0mkxr/20200923234011-ieuun1p.sy"
                }
            }
        ],
        apiLink: 'https://github.com/siyuan-note/siyuan/blob/master/API.md#put-file'
    }
};

// Remove file
const removeFileHandler: CommandHandler = {
    namespace,
    name: 'removeFile',
    description: 'Remove file',
    params: z.object({
        path: z.string().describe('File path')
    }),
    handler: createHandler('/api/file/removeFile'),
    documentation: {
        description: 'Remove file',
        params: {
            path: {
                type: 'string',
                description: 'File path',
                required: true
            }
        },
        returns: {
            type: 'object',
            description: 'Operation result',
            properties: {}
        },
        examples: [
            {
                description: 'This example shows how to permanently delete a file from the specified path in the data directory.',
                params: {
                    path: "/data/20210808180117-6v0mkxr/20200923234011-ieuun1p.sy"
                },
                response: {}
            }
        ],
        apiLink: 'https://github.com/siyuan-note/siyuan/blob/master/API.md#remove-file'
    }
};

// List files
const readDirHandler: CommandHandler = {
    namespace,
    name: 'readDir',
    description: 'List files in directory',
    params: z.object({
        path: z.string().describe('Directory path')
    }),
    handler: createHandler('/api/file/readDir'),
    documentation: {
        description: 'List files in directory',
        params: {
            path: {
                type: 'string',
                description: 'Directory path',
                required: true
            }
        },
        returns: {
            type: 'object',
            description: 'Directory content',
            properties: {
                files: 'Array of file information'
            }
        },
        examples: [
            {
                description: 'This example lists all files and directories within a specified directory, providing information about each item\'s type and name.',
                params: {
                    path: "/data/20210808180117-6v0mkxr"
                },
                response: {
                    files: [
                        {
                            isDir: false,
                            name: "20200923234011-ieuun1p.sy"
                        }
                    ]
                }
            }
        ],
        apiLink: 'https://github.com/siyuan-note/siyuan/blob/master/API.md#list-files'
    }
};

// Rename file
const renameFileHandler: CommandHandler = {
    namespace,
    name: 'renameFile',
    description: 'Rename a file or directory',
    params: z.object({
        path: z.string().describe('Current file path (relative to workspace)'),
        newPath: z.string().describe('New file path (relative to workspace)')
    }),
    handler: createHandler('/api/file/renameFile'),
    documentation: {
        description: 'Rename a file or directory within the workspace',
        params: {
            path: { type: 'string', description: 'Current file path', required: true },
            newPath: { type: 'string', description: 'New file path', required: true }
        },
        returns: { type: 'object', description: 'Operation result', properties: {} },
        examples: [{
            description: 'Rename an asset file',
            params: {
                path: '/data/assets/image-20230523085812-k3o9t32.png',
                newPath: '/data/assets/test-20230523085812-k3o9t32.png'
            },
            response: {}
        }],
        apiLink: 'https://github.com/siyuan-note/siyuan/blob/master/API.md#rename-file'
    }
};

// Register all file related commands
export function registerFileHandlers() {
    registry.registerCommand(getFileHandler);
    registry.registerCommand(putFileHandler);
    registry.registerCommand(removeFileHandler);
    registry.registerCommand(readDirHandler);
    registry.registerCommand(renameFileHandler);
}