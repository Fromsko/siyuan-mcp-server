import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export function getPackageVersion(fallback = '0.0.0'): string {
    try {
        const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
        const packageJson = JSON.parse(readFileSync(resolve(packageRoot, 'package.json'), 'utf8'));
        return typeof packageJson.version === 'string' ? packageJson.version : fallback;
    } catch {
        return fallback;
    }
}
