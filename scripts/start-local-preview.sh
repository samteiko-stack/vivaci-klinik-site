#!/usr/bin/env bash
# Client preview = same Python server as dev (not Vercel static).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

lsof -ti :8765 2>/dev/null | xargs kill -9 2>/dev/null || true
python3 scripts/dev-server.py &
sleep 1

if command -v cloudflared >/dev/null 2>&1; then
  echo "Local:  http://127.0.0.1:8765/"
  exec cloudflared tunnel --url "http://127.0.0.1:8765"
fi

echo "Local:  http://127.0.0.1:8765/"
echo "Install cloudflared for a public link: brew install cloudflared"
