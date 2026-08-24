/**
 * Installs the E2E upstream mock in whatever Next process loads it — a `next build` prerender
 * worker or the `next start` server.
 *
 * Loaded via `NODE_OPTIONS --import` rather than `src/instrumentation.ts`, because Next skips the
 * instrumentation hook during a production build: `registerInstrumentation()` returns early when
 * `NEXT_PHASE === 'phase-production-build'` (node_modules/next/dist/server/lib/router-utils/
 * instrumentation-globals.external.js), and `next build` sets that phase before spawning its
 * workers. Instrumentation would therefore leave every prerendered page — which is what a reader
 * actually gets — fetching the live AFP API. A NODE_OPTIONS preload reaches the build workers
 * because Next forwards NODE_OPTIONS when it forks them (next/dist/lib/worker.js).
 *
 * Keeping it out of `src/` also keeps `msw`, a devDependency, off every production code path.
 */
import { setupServer } from 'msw/node'
import { createHash } from 'node:crypto'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  PROBE_PATH,
  buildHandlers,
  mockNacHost,
  onUnhandledRequest,
} from '../../__tests__/e2e/mocks/handlers.mjs'

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const stateDir = join(repoRoot, '.e2e-mocks')

// msw's fetch interceptor throws if it patches a process twice. A global marker survives module
// registry duplication, which a bundled second copy of this module would otherwise cause.
const INSTALLED = Symbol.for('avyweb.e2e.msw.installed')

if (!globalThis[INSTALLED]) {
  globalThis[INSTALLED] = true

  const server = setupServer(...buildHandlers())
  server.listen({ onUnhandledRequest })

  // Prove interception is live in THIS process before Next renders anything. Without it, a preload
  // that loaded but failed to patch would surface as upstream errors deep in a page render, which
  // reads like a fixture gap rather than a broken harness.
  const probe = await fetch(`${mockNacHost}${PROBE_PATH}`).catch((cause) => ({ ok: false, cause }))
  if (!probe.ok) {
    console.error(
      '[e2e-mocks] interception is NOT active in this process; refusing to continue',
      probe.cause ?? '',
    )
    process.exit(1)
  }

  // Playwright's globalSetup reads this to refuse to run against an unmocked server.
  if (process.env.E2E_MOCK_ROLE === 'start') {
    const scenarios = readFileSync(join(repoRoot, '__tests__/e2e/mocks/scenarios.json'))
    mkdirSync(stateDir, { recursive: true })
    writeFileSync(
      join(stateDir, 'active.json'),
      JSON.stringify({
        pid: process.pid,
        port: process.env.PORT,
        distDir: process.env.NEXT_DIST_DIR,
        scenariosSha: createHash('sha256').update(scenarios).digest('hex'),
      }),
    )
  }
}
