#!/usr/bin/env bash
# Kill everything listening on PawHaven's local dev ports, then restart all apps.
# Usage: pnpm dev:restart  (or: bash scripts/restart-dev.sh)

set -euo pipefail

# Local dev ports used by PawHaven services
#   gateway          -> 8080
#   core-service     -> 8081
#   auth-service     -> 8082
#   document-service -> 8083
#   portal (vite)    -> 3001
PORTS=(8080 8081 8082 8083 3001)

echo "🔪 Killing processes on dev ports: ${PORTS[*]}"

for port in "${PORTS[@]}"; do
  # lsof -ti returns the PIDs holding the TCP port (macOS/Linux compatible)
  pids="$(lsof -ti tcp:"$port" 2>/dev/null || true)"
  if [ -n "$pids" ]; then
    echo "  -> port $port: $pids"
    # shellcheck disable=SC2086
    kill -9 $pids 2>/dev/null || true
  else
    echo "  -> port $port: (nothing listening)"
  fi
done

# Clean up any lingering turbo dev watchers that may have orphaned the ports
pkill -f "turbo run dev" 2>/dev/null || true

# Give the OS a moment to release the sockets before rebinding
sleep 1

echo "🚀 Restarting all apps (build:libs + turbo run dev)..."
pnpm run dev:all
