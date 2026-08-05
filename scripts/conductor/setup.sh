#!/usr/bin/env bash
#
# Conductor (conductor.build) `setup` hook — runs on every workspace launch, so it
# MUST be idempotent. It:
#   1. installs deps (fast when node_modules is warm),
#   2. probes a free, stable port block from the CONDUCTOR_PORT hint and writes
#      .conductor/ports.env (consumed by run.sh),
#   3. seeds the local SQLite DB ONLY on first launch (when dev.db is absent).
#
# Fully backward-compatible: when CONDUCTOR_PORT is unset (a teammate not using
# Conductor never runs this), it defaults to the normal 3000/9229 ports.
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$REPO_ROOT"
# shellcheck source=scripts/conductor/probe.sh
source "$REPO_ROOT/scripts/conductor/probe.sh"

BLOCK_SIZE=2 # offset 0 = next dev HTTP port, offset 1 = Node --inspect port
PORTS_FILE="$REPO_ROOT/.conductor/ports.env"

# 1) deps — idempotent; a no-op when already installed
pnpm install

# 2) choose a free, stable port block
if [ -n "${CONDUCTOR_PORT:-}" ]; then
  HINT="$CONDUCTOR_PORT"
  # Prefer the previously-chosen port so the workspace URL stays stable across restarts.
  if [ -f "$PORTS_FILE" ]; then
    PREV="$(grep -E '^PORT=' "$PORTS_FILE" 2>/dev/null | cut -d= -f2 || true)"
    [ -n "$PREV" ] && HINT="$PREV"
  fi
  if ! BASE="$(find_free_block "$HINT" "$BLOCK_SIZE")"; then
    echo "conductor: ERROR — no free ${BLOCK_SIZE}-port block from $HINT" >&2
    exit 1
  fi
  [ "$BASE" != "$HINT" ] && echo "conductor: shifted off $HINT -> $BASE (collision)"
  PORT="$BASE"
  INSPECT_PORT="$((BASE + 1))"
else
  # Non-Conductor safety net — never reached inside a Conductor workspace.
  PORT=3000
  INSPECT_PORT=9229
fi

mkdir -p "$REPO_ROOT/.conductor"
cat >"$PORTS_FILE" <<EOF
PORT=$PORT
INSPECT_PORT=$INSPECT_PORT
NEXT_PUBLIC_ROOT_DOMAIN=localhost:$PORT
EOF
echo "conductor: PORT=$PORT INSPECT_PORT=$INSPECT_PORT (localhost:$PORT)"

# 3) first-run seed only — never wipe an existing workspace DB on relaunch
if [ ! -f "$REPO_ROOT/dev.db" ]; then
  echo "conductor: no dev.db — seeding (first launch)…"
  # Match the documented WAL journal mode if the sqlite3 CLI is available (best-effort;
  # seed:standalone works without it — Payload push-mode creates the DB regardless).
  command -v sqlite3 >/dev/null 2>&1 && sqlite3 "$REPO_ROOT/dev.db" 'PRAGMA journal_mode=WAL;' >/dev/null
  # Seed with the workspace's own origin so any URL derivation matches the port.
  set -a
  # shellcheck source=/dev/null
  . "$PORTS_FILE"
  set +a
  pnpm seed:standalone
else
  echo "conductor: dev.db present — skipping seed"
fi
