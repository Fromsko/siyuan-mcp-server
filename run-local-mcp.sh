#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PORT_JSON="${SIYUAN_PORT_JSON:-$HOME/.config/siyuan/port.json}"
SERVER_PATH="$SCRIPT_DIR/dist/server.js"

if [[ ! -f "$SERVER_PATH" ]]; then
  echo "SiYuan MCP server build not found at $SERVER_PATH. Run npm run build first." >&2
  exit 1
fi

if [[ ! -f "$PORT_JSON" ]]; then
  echo "SiYuan port file not found at $PORT_JSON. Start SiYuan first." >&2
  exit 1
fi

PORT="$(
  node - "$PORT_JSON" <<'NODE'
const fs = require('node:fs');

const portFile = process.argv[2];
const data = JSON.parse(fs.readFileSync(portFile, 'utf8'));
const port = Object.values(data).find(value => value !== undefined && value !== null && String(value).length > 0);

if (!port) {
  process.exit(1);
}

process.stdout.write(String(port));
NODE
)"

if [[ -z "$PORT" ]]; then
  echo "No SiYuan kernel port found in $PORT_JSON. Start SiYuan first." >&2
  exit 1
fi

export SIYUAN_API_URL="${SIYUAN_API_URL:-http://127.0.0.1:$PORT}"

node - "$SIYUAN_API_URL" <<'NODE'
const apiUrl = process.argv[2];
const controller = new AbortController();
const timeout = setTimeout(() => controller.abort(), 3000);

fetch(`${apiUrl}/api/system/currentTime`, {
  method: 'POST',
  headers: {
    Authorization: `Token ${process.env.SIYUAN_TOKEN || ''}`,
    'Content-Type': 'application/json'
  },
  body: '{}',
  signal: controller.signal
})
  .then(async response => {
    clearTimeout(timeout);
    if (!response.ok) {
      const text = await response.text();
      throw new Error(`HTTP ${response.status}: ${text}`);
    }
  })
  .catch(error => {
    clearTimeout(timeout);
    console.error(`Unable to reach SiYuan API at ${apiUrl}. Start SiYuan or check SIYUAN_TOKEN. ${error.message}`);
    process.exit(1);
  });
NODE

exec node "$SERVER_PATH"
