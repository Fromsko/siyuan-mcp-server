import { client } from './client.js';

/**
 * SiYuan ID path regex: /YYYYMMDDHHmmss-xxxxxxx.sy segments
 * e.g. /20210917220500-sz588nq/20210917220056-yxtyl7i.sy
 */
const ID_PATH_RE = /^(\/\d{14}-[a-z0-9]{7})+\.sy$/;

/**
 * Check if a path is already a SiYuan document ID path.
 */
export function isIdPath(path: string): boolean {
    return ID_PATH_RE.test(path);
}

/**
 * Check if a path looks like a human-readable path (hpath).
 * hpath: /folder/subfolder/doc-title (no .sy extension, no timestamp pattern)
 */
export function isHPath(path: string): boolean {
    return !isIdPath(path);
}

/**
 * Resolve a human-readable path to document IDs via SiYuan API.
 * Calls /api/filetree/getIDsByHPath.
 *
 * @returns Array of document IDs (e.g. ["20200813004931-q4cu8na"])
 */
export async function resolveHPathToIDs(notebook: string, hpath: string): Promise<string[]> {
    const response = await client.post('/api/filetree/getIDsByHPath', {
        notebook,
        path: hpath,
    });
    const ids = response.data;
    if (!Array.isArray(ids) || ids.length === 0) {
        throw new Error(
            `Cannot resolve hpath "${hpath}" in notebook "${notebook}". ` +
            `No documents found. Check the path and notebook ID.`
        );
    }
    return ids as string[];
}

/**
 * Get the storage path (ID path) for a document by its block ID.
 * Calls /api/filetree/getPathByID.
 *
 * @returns { notebook, path } where path is the ID path (e.g. "/20210917220500-sz588nq/20210917220056-yxtyl7i.sy")
 */
export async function getPathByID(id: string): Promise<{ notebook: string; path: string }> {
    const response = await client.post('/api/filetree/getPathByID', { id });
    return response.data as { notebook: string; path: string };
}

/**
 * Resolve a path to its ID path format.
 * If already an ID path, returns it as-is.
 * If hpath, resolves via getIDsByHPath + getPathByID.
 *
 * @returns The ID path string (e.g. "/20210917220500-sz588nq/20210917220056-yxtyl7i.sy")
 */
export async function resolveToIdPath(notebook: string, path: string): Promise<string> {
    if (isIdPath(path)) {
        return path;
    }
    const ids = await resolveHPathToIDs(notebook, path);
    const resolved = await getPathByID(ids[0]);
    return resolved.path;
}
