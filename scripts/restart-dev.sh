#!/usr/bin/env bash
# pnpm dev:local — frees the dev ports, then builds libs and runs turbo dev.
set -euo pipefail

bash "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/kill-dev-ports.sh"

echo "🚀 Restarting all apps (build:libs + turbo run dev)..."
pnpm run dev:all
