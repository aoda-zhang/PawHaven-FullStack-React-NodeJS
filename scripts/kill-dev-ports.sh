#!/usr/bin/env bash
# Frees the dev ports before `turbo run dev` starts; a stale process would keep them bound.
set -euo pipefail

PORTS=(8080 8081 8082 8083 3001)

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

pid_cwd() {
  local pid="$1"
  if [ -r "/proc/$pid/cwd" ]; then
    readlink "/proc/$pid/cwd" 2>/dev/null || true
  else
    lsof -a -d cwd -p "$pid" -Fn 2>/dev/null | sed -n 's/^n//p' | head -n 1
  fi
}

is_repo_pid() {
  local cwd
  cwd="$(pid_cwd "$1")"
  case "$cwd" in
    "$REPO_ROOT"|"$REPO_ROOT"/*) return 0 ;;
    *) return 1 ;;
  esac
}

kill_repo_pid() {
  if is_repo_pid "$1"; then
    kill -9 "$1" 2>/dev/null || true
  else
    echo "  -> PID $1 is not a PawHaven process; leaving it alone"
  fi
}

echo "🔪 Killing PawHaven processes on dev ports: ${PORTS[*]}"

for port in "${PORTS[@]}"; do
  # -sTCP:LISTEN skips unrelated outbound connections to the port
  pids="$(lsof -ti tcp:"$port" -sTCP:LISTEN 2>/dev/null || true)"
  if [ -n "$pids" ]; then
    echo "  -> port $port: $pids"
    for pid in $pids; do
      kill_repo_pid "$pid"
    done
  else
    echo "  -> port $port: (nothing listening)"
  fi
done

turbo_pids="$(pgrep -f "turbo run dev" 2>/dev/null || true)"
if [ -n "$turbo_pids" ]; then
  for pid in $turbo_pids; do
    kill_repo_pid "$pid"
  done
fi

sleep 1
