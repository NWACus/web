# Conductor parallel workspaces

[Conductor](https://conductor.build) runs several isolated workspaces of this repo at once — each in its own git worktree with its own `dev.db`. This doc explains the per-workspace port isolation we added and why it's a no-op for anyone not using Conductor.

## TL;DR for teammates who don't use Conductor

**Nothing changes for you.** `pnpm dev` still serves `http://localhost:3000`, the debugger still attaches on `9229`, and `pnpm seed` is unchanged. The Conductor files (`.conductor/settings.toml`, `scripts/conductor/*`) only run when Conductor invokes them, and the one shared edit — the `dev` script — falls back to the exact same ports when its env vars are unset:

```jsonc
// package.json — identical behavior when PORT / INSPECT_PORT are unset
"dev": "cross-env NODE_OPTIONS=\"${NODE_OPTIONS} --no-deprecation --inspect=${INSPECT_PORT:-9229}\" next dev --port ${PORT:-3000}"
```

## What Conductor does per workspace

The base `CONDUCTOR_PORT` that Conductor assigns is **not** globally unique, so two workspaces can collide. We defend against that with a free-block probe instead of trusting the hint blindly.

- **`setup` hook → `scripts/conductor/setup.sh`** (runs every launch, idempotent):
  1. `pnpm install`
  2. Probe upward from `CONDUCTOR_PORT` for 2 consecutive free ports (checking OS listeners + any docker-published ports), preferring the port previously chosen so the workspace URL stays stable. Write `.conductor/ports.env`.
  3. Seed the DB **only if `dev.db` is absent** (first launch) via `pnpm seed:standalone` → login `admin@avy.com` / `localpass`.
- **`run` hook → `scripts/conductor/run.sh`**: loads `.conductor/ports.env` and `exec pnpm dev`.

`.conductor/ports.env` holds `PORT`, `INSPECT_PORT`, and `NEXT_PUBLIC_ROOT_DOMAIN=localhost:$PORT`. Setting `NEXT_PUBLIC_ROOT_DOMAIN` to match the chosen port is what keeps middleware tenant resolution and Payload CORS/CSRF consistent when the port shifts. The file is gitignored and regenerated each launch, so never edit it by hand.

### The probe

`scripts/conductor/probe.sh` exposes `find_free_block <hint> <size>`, which scans upward from `<hint>` for the first run of `<size>` consecutive free ports. It works with or without docker. Quick manual check (safe, read-only):

```bash
bash -c 'source scripts/conductor/probe.sh; find_free_block 3000 2'
```

With a dev server already on 3000 this prints the next free base (e.g. `3002`).

## Notes / limits

- **Secrets:** Conductor's default copy pattern (`.env*`) carries the gitignored `.env` into each workspace automatically, so we set no `file_include_globs`.
- **DB seed** uses `seed:standalone` (in-process, no temp server, no `sqlite3` CLI dependency). To re-seed a workspace, delete its `dev.db*` and relaunch.
- **Subdomains** (`nwac.localhost:$PORT`) rely on the machine-global `/etc/hosts` entries you already have; they're port-independent.
- **Not isolated:** the Playwright e2e suite (hardcoded `localhost:3000` in specs) and the standalone `pnpm email:dev` (3001) are not part of the Conductor run flow.
