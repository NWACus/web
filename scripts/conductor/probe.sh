# shellcheck shell=bash
# Canonical free-block port probe for Conductor (conductor.build) workspaces.
# Sourced (no shebang); requires bash for C-style for-loops and `local`.
#
# Source this file, then call `find_free_block <hint> <size> [own_project] [max_scan]`.
# It scans upward from <hint> for the first run of <size> consecutive ports that
# are ALL free, and echoes the base port of that run (exit 1 if none found).
#
# "Free" means: no OS TCP listener AND not published by any docker container —
# EXCEPT containers belonging to <own_project> (your own COMPOSE_PROJECT_NAME),
# which are treated as yours so re-running setup on a healthy stack doesn't churn.
#
# Why both checks: non-Conductor tools (a host Postgres, the Supabase CLI stack)
# squat ports without participating in CONDUCTOR_PORT offsets. The OS check finds
# bare listeners; the docker check finds published host ports even when lsof races
# (the `{"5432/tcp":[]}` no-binding failure mode).
#
# macOS/BSD + Linux compatible. Requires: lsof; docker is optional.

# port_in_use PORT [OWN_COMPOSE_PROJECT]
#   returns 0 (in use) if a FOREIGN listener/container holds PORT, else 1.
port_in_use() {
  local port="$1" own="${2:-}"

  # 1) docker-published host ports (authoritative for our compose stacks)
  if command -v docker >/dev/null 2>&1; then
    local owners
    owners="$(docker ps --format '{{.Names}}'$'\t''{{.Ports}}' 2>/dev/null \
      | awk -v pat=":${port}->" 'index($0, pat) {print $1}')"
    if [ -n "$owners" ]; then
      # FOREIGN if any owning container is not part of our own project.
      if [ -z "$own" ] || printf '%s\n' "$owners" | grep -qv "^${own}"; then
        return 0
      fi
      # All owners are ours → the port is ours, not a conflict.
      return 1
    fi
  fi

  # 2) bare OS TCP listener (host Postgres, Supabase CLI, stray dev server, …)
  lsof -nP -iTCP:"$port" -sTCP:LISTEN >/dev/null 2>&1 && return 0

  return 1
}

# find_free_block HINT SIZE [OWN_COMPOSE_PROJECT] [MAX_SCAN]
#   echoes base port of the first free run of SIZE ports at/after HINT.
find_free_block() {
  local hint="$1" size="$2" own="${3:-}" max_scan="${4:-500}"
  local base="$hint" tries=0 p ok
  while [ "$tries" -lt "$max_scan" ]; do
    ok=1
    for ((p = base; p < base + size; p++)); do
      if port_in_use "$p" "$own"; then ok=0; break; fi
    done
    if [ "$ok" -eq 1 ]; then echo "$base"; return 0; fi
    base=$((p + 1)) # jump past the colliding port, not just +1
    tries=$((tries + 1))
  done
  return 1
}
