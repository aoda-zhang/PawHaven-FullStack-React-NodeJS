#!/usr/bin/env bash
# Kill PawHaven-owned processes listening on the local dev ports, then restart all apps.
# Usage: pnpm dev:restart  (or: bash scripts/restart-dev.sh)

set -euo pipefail

# Local dev ports used by PawHaven services
#   gateway          -> 8080
#   core-service     -> 8081
#   auth-service     -> 8082
#   document-service -> 8083
#   portal (vite)    -> 3001
PORTS=(8080 8081 8082 8083 3001)

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# Print the working directory of a PID, or nothing when it cannot be determined.
pid_cwd() {
  local pid="$1"
  if [ -r "/proc/$pid/cwd" ]; then
    readlink "/proc/$pid/cwd" 2>/dev/null || true
  else
    lsof -a -d cwd -p "$pid" -Fn 2>/dev/null | sed -n 's/^n//p' | head -n 1
  fi
}

# Only processes whose working directory lives inside this repository are ours.
is_repo_pid() {
  local cwd
  cwd="$(pid_cwd "$1")"
  case "$cwd" in
    "$REPO_ROOT"|"$REPO_ROOT"/*) return 0 ;;
    *) return 1 ;;
  esac
}

# Never signal a PID we could not attribute to this repository.
kill_repo_pid() {
  if is_repo_pid "$1"; then
    kill -9 "$1" 2>/dev/null || true
  else
    echo "  -> PID $1 is not a PawHaven process (cwd outside $REPO_ROOT); leaving it alone"
  fi
}

echo "🔪 Killing PawHaven processes on dev ports: ${PORTS[*]}"

for port in "${PORTS[@]}"; do
  # lsof -ti returns the PIDs holding the TCP port (macOS/Linux compatible)
  pids="$(lsof -ti tcp:"$port" 2>/dev/null || true)"
  if [ -n "$pids" ]; then
    echo "  -> port $port: $pids"
    for pid in $pids; do
      kill_repo_pid "$pid"
    done
  else
    echo "  -> port $port: (nothing listening)"
  fi
done

# Clean up any lingering turbo dev watchers that may have orphaned the ports
turbo_pids="$(pgrep -f "turbo run dev" 2>/dev/null || true)"
if [ -n "$turbo_pids" ]; then
  for pid in $turbo_pids; do
    kill_repo_pid "$pid"
  done
fi

# Give the OS a moment to release the sockets before rebinding
sleep 1

echo "🚀 Restarting all apps (build:libs + turbo run dev)..."
pnpm run dev:all
