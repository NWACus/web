#!/usr/bin/env bash
#
# Conductor (conductor.build) `run` hook. Loads the per-workspace ports chosen by
# setup.sh (PORT, INSPECT_PORT, NEXT_PUBLIC_ROOT_DOMAIN) and starts the dev server.
# The `dev` script reads ${PORT:-3000} / ${INSPECT_PORT:-9229}, and Next.js inlines
# the exported NEXT_PUBLIC_ROOT_DOMAIN (process env beats .env), keeping the origin,
# CORS/CSRF and tenant routing consistent with the chosen port.
#
# Backward-compatible: with no ports.env (a non-Conductor checkout), this falls
# through to a plain `pnpm dev` on the default 3000/9229.
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$REPO_ROOT"

if [ -f "$REPO_ROOT/.conductor/ports.env" ]; then
  set -a
  # shellcheck source=/dev/null
  . "$REPO_ROOT/.conductor/ports.env"
  set +a
fi

exec pnpm dev
