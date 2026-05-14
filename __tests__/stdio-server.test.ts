import { spawn } from 'node:child_process';
import type { ChildProcessWithoutNullStreams } from 'node:child_process';
import { once } from 'node:events';
import packageJson from '../package.json';

function waitForJsonLine(child: ChildProcessWithoutNullStreams, timeoutMs = 5000): Promise<any> {
    return new Promise((resolve, reject) => {
        let stdout = '';
        const timeout = setTimeout(() => {
            reject(new Error(`Timed out waiting for JSON-RPC response. stdout: ${stdout}`));
        }, timeoutMs);

        child.stdout.on('data', chunk => {
            stdout += chunk.toString();
            const line = stdout.split('\n').find(item => item.trim().length > 0);
            if (!line) {
                return;
            }

            clearTimeout(timeout);
            try {
                resolve(JSON.parse(line));
            } catch {
                reject(new Error(`First stdout line is not JSON: ${line}`));
            }
        });

        child.once('error', error => {
            clearTimeout(timeout);
            reject(error);
        });

        child.once('exit', code => {
            clearTimeout(timeout);
            reject(new Error(`Server exited before responding with code ${code}`));
        });
    });
}

describe('stdio server', () => {
    it('starts from the package binary target without writing non-JSON logs to stdout', async () => {
        const binTarget = packageJson.bin['siyuan-mcp-server'];
        const child = spawn(process.execPath, [binTarget], {
            cwd: process.cwd(),
            env: {
                ...process.env,
                NODE_ENV: 'test',
                SIYUAN_TOKEN: 'test-token',
                SIYUAN_API_URL: 'http://127.0.0.1:1'
            },
            stdio: ['pipe', 'pipe', 'pipe']
        });

        const responsePromise = waitForJsonLine(child);

        child.stdin.write(`${JSON.stringify({
            jsonrpc: '2.0',
            id: 1,
            method: 'initialize',
            params: {
                protocolVersion: '2024-11-05',
                capabilities: {},
                clientInfo: {
                    name: 'stdio-test',
                    version: '0.0.0'
                }
            }
        })}\n`);

        const response = await responsePromise;
        expect(response).toMatchObject({
            jsonrpc: '2.0',
            id: 1,
            result: {
                serverInfo: {
                    name: 'siyuan-mcp-server',
                    version: packageJson.version
                }
            }
        });

        const exitPromise = once(child, 'exit');
        child.kill();
        await exitPromise;
    });
});
