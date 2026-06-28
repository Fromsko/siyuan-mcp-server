import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export function getPackageVersion(fallback = '0.0.0'): string {
    try {
        // __dirname equivalent in ESM
        const currentDir = dirname(fileURLToPath(import.meta.url));
        const packageRoot = resolve(currentDir, '../..');
        const packagePath = resolve(packageRoot, 'package.json');
        const content = readFileSync(packagePath, 'utf8');
        if (!content || content.trim() === '') {
            return fallback;
        }
        const packageJson = JSON.parse(content);
        return typeof packageJson.version === 'string' ? packageJson.version : fallback;
    } catch {
        return fallback;
    }
}
