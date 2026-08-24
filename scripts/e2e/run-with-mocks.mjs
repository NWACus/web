#!/usr/bin/env node
/**
 * Run `next build` or `next start` against the E2E upstream mock.
 *
 * A wrapper rather than an env var in CI, because the `build` and `start` package scripts set
 * `NODE_OPTIONS` with `cross-env`, which REPLACES whatever the caller exported — a preload injected
 * from outside would be silently dropped and the suite would go green against the live API.
 *
 * Three things here make an unmocked run impossible rather than merely detectable:
 *
 * - `NAC_HOST`/`AFP_HOST` are pointed at the reserved `.invalid` TLD (RFC 2606), which can never
 *   resolve. `src/services/nac/hosts.ts` and the mock handlers both read these, so they still agree
 *   — but a process where interception failed gets a DNS failure instead of real forecast data.
 * - The build lands in its own `distDir`, so an ordinary `pnpm build` can never be mistaken for a
 *   mocked one.
 * - The build records its BUILD_ID, which Playwright's globalSetup checks against what is served.
 */
import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const nextBin = join(repoRoot, 'node_modules/.bin/next')
const preload = pathToFileURL(join(repoRoot, 'scripts/e2e/msw-preload.mjs')).href
const stateDir = join(repoRoot, '.e2e-mocks')

export const DIST_DIR = '.next-e2e'
export const DEFAULT_PORT = '3100'

const mode = process.argv[2]
if (!['build', 'start'].includes(mode)) {
  console.error('Usage: run-with-mocks.mjs build|start')
  process.exit(1)
}

const port = process.env.PORT || DEFAULT_PORT

function run(command, extraNodeOptions = []) {
  // Exactly one `--import`, composed from scratch: Next re-serialises NODE_OPTIONS when it forks
  // build workers, and a repeated flag parses to an array its formatter cannot re-emit. Any
  // ambient NODE_OPTIONS is deliberately dropped for the same reason.
  const result = spawnSync(nextBin, command, {
    cwd: repoRoot,
    stdio: 'inherit',
    env: {
      ...process.env,
      NODE_OPTIONS: ['--no-deprecation', ...extraNodeOptions, `--import=${preload}`].join(' '),
      NEXT_DIST_DIR: DIST_DIR,
      // NEXT_PHASE is not set yet in the build's parent process when the preload runs, so the
      // preload cannot infer its own role. Say it explicitly.
      E2E_MOCK_ROLE: mode,
      NAC_HOST: 'http://nac.e2e-mock.invalid',
      AFP_HOST: 'http://afp.e2e-mock.invalid',
      PORT: port,
      NEXT_PUBLIC_ROOT_DOMAIN: `localhost:${port}`,
      // Pin the clock: the goldens are Mountain-time products, and the valid-date cutover, the
      // archive window and the expiry banner all read a timezone.
      TZ: 'America/Denver',
    },
  })

  if (result.error) throw result.error
  return result.status ?? 1
}

const scenariosSha = () =>
  createHash('sha256')
    .update(readFileSync(join(repoRoot, '__tests__/e2e/mocks/scenarios.json')))
    .digest('hex')

/** True when `.next-e2e` holds a mocked build of the scenario table as it stands right now. */
function buildIsCurrent() {
  try {
    const built = JSON.parse(readFileSync(join(stateDir, 'build.json'), 'utf8'))
    const buildId = readFileSync(join(repoRoot, DIST_DIR, 'BUILD_ID'), 'utf8').trim()
    return built.buildId === buildId && built.scenariosSha === scenariosSha()
  } catch {
    return false
  }
}

/**
 * Fail the build if a forecast page was prerendered as a 404.
 *
 * `dynamicParams = false` means a zone missing from `generateStaticParams` renders Next's
 * not-found shell, and ISR quietly repairs it on the first request — so without this check the
 * suite could be asserting against pages that were broken at build time and only look fine
 * because a test happened to warm them first. Next records the rendered status in the `.meta`
 * file beside each prerendered route; the HTML is not a usable signal, because every page's
 * flight payload carries the not-found slot whether or not it rendered.
 */
function assertNoNotFoundShells() {
  const shells = []

  const walk = (dir) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const path = join(dir, entry.name)
      if (entry.isDirectory()) {
        walk(path)
      } else if (entry.name.endsWith('.meta') && path.includes('forecasts/avalanche')) {
        if (JSON.parse(readFileSync(path, 'utf8')).status === 404) {
          shells.push(path.slice(repoRoot.length + 1))
        }
      }
    }
  }

  walk(join(repoRoot, DIST_DIR, 'server/app'))
  if (shells.length > 0) {
    console.error(
      `[e2e-mocks] ${shells.length} forecast page(s) prerendered as 404:\n  ${shells.join('\n  ')}`,
    )
    process.exit(1)
  }
}

function build() {
  mkdirSync(stateDir, { recursive: true })
  // Next's fetch cache survives between builds. A mocked build must start from nothing, or it can
  // prerender against whatever the previous scenario table happened to leave behind.
  rmSync(join(repoRoot, DIST_DIR, 'cache'), { recursive: true, force: true })
  // Start the missing-golden log clean so globalSetup can tell "the build covered everything" from
  // "a previous run left findings behind".
  writeFileSync(join(stateDir, 'missing-fixtures.jsonl'), '')

  const status = run(['build'], ['--max-old-space-size=4096'])
  if (status !== 0) process.exit(status)

  assertNoNotFoundShells()

  writeFileSync(
    join(stateDir, 'build.json'),
    JSON.stringify({
      buildId: readFileSync(join(repoRoot, DIST_DIR, 'BUILD_ID'), 'utf8').trim(),
      scenariosSha: scenariosSha(),
    }),
  )
}

if (mode === 'build') {
  build()
  process.exit(0)
}

// Serving a stale build would test yesterday's fixtures against today's assertions.
if (!existsSync(join(repoRoot, DIST_DIR, 'BUILD_ID')) || !buildIsCurrent()) {
  console.log('[e2e-mocks] no current mocked build; building first')
  build()
}

process.exit(run(['start', '--port', port]))
