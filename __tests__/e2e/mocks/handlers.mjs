/**
 * The E2E upstream mock: every NAC/AFP response the native product pages read, served from the
 * vendored golden corpus.
 *
 * Plain ESM rather than TypeScript because this is loaded by a `--import` preload that runs inside
 * `next build`'s worker processes, before any bundler exists. `scenarios.json` is the shared source
 * of truth so the Playwright specs and these handlers cannot disagree about which fixture is served
 * where.
 *
 * Two rules make this deterministic under `fullyParallel` Playwright and Next's four cache layers:
 *
 * 1. The handler set is immutable. A scenario is addressed by URL — center id x zone id — never by
 *    mutating handlers between tests. Next caches responses at build time and replays them at
 *    request time, so a mutated handler would be invisible anyway.
 * 2. The one exception is a `phase` product: a pure function of NEXT_PHASE, so one fixture is baked
 *    into the prerender and a different one is served at request time. That is what makes the
 *    freshness path (inventory row X5 — a correction reaching readers immediately) observable.
 *
 * An unmapped NAC/AFP request is a harness bug, never a pass: it answers 501 and is recorded to
 * `.e2e-mocks/missing-fixtures.jsonl`, which fails the Playwright run. Answering it any other way
 * would let a page degrade to "Unable to load forecast data" and a test still go green.
 */
import { HttpResponse, http } from 'msw'
import { appendFileSync, existsSync, mkdirSync, readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const mocksDir = dirname(fileURLToPath(import.meta.url))
const repoRoot = resolve(mocksDir, '../../..')
const missingLog = join(repoRoot, '.e2e-mocks/missing-fixtures.jsonl')

const scenarios = JSON.parse(readFileSync(join(mocksDir, 'scenarios.json'), 'utf8'))

// Read the same way src/services/nac/hosts.ts reads them, so the handlers and the code under test
// resolve identical URLs by construction. __tests__/server/e2eMocks.server.test.ts asserts the
// defaults still agree. `run-with-mocks.mjs` sets both to unresolvable `.invalid` hosts, so a
// process where interception failed cannot reach the real API.
export const mockNacHost = process.env.NAC_HOST || 'https://api.avalanche.org'
export const mockAfpHost = process.env.AFP_HOST || 'https://forecasts.avalanche.org'

/** Answered only by this mock; the preload requests it at boot to prove interception is live. */
export const PROBE_PATH = '/__e2e-mock-probe'

const fixtureCache = new Map()

function fixture(name) {
  if (!fixtureCache.has(name)) {
    const vendored = join(mocksDir, 'afp-golden', name)
    const path = existsSync(vendored) ? vendored : join(mocksDir, 'provisional', name)
    fixtureCache.set(name, readFileSync(path, 'utf8'))
  }
  return fixtureCache.get(name)
}

/**
 * Serve a fixture the way v2 served it. Some "not found" answers are a 200 carrying the legacy
 * PHP error page rather than a 404 — the page's own error handling depends on the difference, so
 * the mock reproduces it instead of normalising it away.
 */
function fixtureResponse(name) {
  const body = fixture(name)
  if (name.endsWith('.html')) {
    return new HttpResponse(body, { headers: { 'Content-Type': 'text/html' } })
  }
  return new HttpResponse(body, { headers: { 'Content-Type': 'application/json' } })
}

/** True while `next build` is prerendering; see the `phase` rule above. */
const isBuildPhase = () => process.env.NEXT_PHASE === 'phase-production-build'

function recordMissing(request) {
  const entry = {
    method: request.method,
    url: request.url,
    phase: isBuildPhase() ? 'build' : 'serve',
    at: new Date().toISOString(),
  }
  mkdirSync(dirname(missingLog), { recursive: true })
  // One sub-4KB append is atomic on POSIX, which matters: `next build` fans out across workers.
  appendFileSync(missingLog, `${JSON.stringify(entry)}\n`)
  console.error(`[e2e-mocks] MISSING GOLDEN ${entry.method} ${entry.url}`)

  return HttpResponse.json(
    { error: 'E2E_MISSING_GOLDEN', ...entry },
    { status: 501, statusText: 'Not Implemented' },
  )
}

function findProduct(centerId, zoneId, type) {
  return scenarios.products.find(
    (product) =>
      product.center === centerId && String(product.zone) === zoneId && product.type === type,
  )
}

function findAbsent(request) {
  const { pathname, search } = new URL(request.url)
  return scenarios.absent.find((entry) => `${pathname}${search}`.includes(entry.match))
}

/** A declared gap answers the way upstream answers, and is not recorded as a harness bug. */
function absentResponse(entry) {
  if (entry.fixture) return fixtureResponse(entry.fixture)
  return new HttpResponse(null, { status: entry.status ?? 404 })
}

export function buildHandlers() {
  return [
    http.get(`${mockNacHost}${PROBE_PATH}`, () => HttpResponse.json({ intercepting: true })),

    // AFP capability feed. afpFetch builds the URL as host root + `?rest_route=...`, with no path.
    http.get(`${mockAfpHost}/`, ({ request }) => {
      const route = new URL(request.url).searchParams.get('rest_route')
      if (route === '/v1/public/avalanche-centers') {
        return fixtureResponse(scenarios.capabilities.fixture)
      }
      return recordMissing(request)
    }),

    http.get(`${mockNacHost}/v2/public/avalanche-center/:centerId`, ({ params, request }) => {
      const center = scenarios.centers[params.centerId]
      if (center?.metadata) return fixtureResponse(center.metadata)
      return recordMissing(request)
    }),

    http.get(`${mockNacHost}/v2/public/products/map-layer/:centerId`, ({ params, request }) => {
      const center = scenarios.centers[params.centerId]
      if (center?.mapLayer) return fixtureResponse(center.mapLayer)

      const absent = findAbsent(request)
      return absent ? absentResponse(absent) : recordMissing(request)
    }),

    // The archive list. The date window narrows the response upstream; the goldens are already
    // small, so the whole list is returned and the page filters it exactly as it would in prod.
    http.get(`${mockNacHost}/v2/public/products`, ({ request }) => {
      const centerId = new URL(request.url).searchParams.get('avalanche_center_id')
      const center = scenarios.centers[centerId]
      if (center?.archive) return fixtureResponse(center.archive)

      const absent = findAbsent(request)
      return absent ? absentResponse(absent) : recordMissing(request)
    }),

    http.get(`${mockNacHost}/v2/public/product`, ({ request }) => {
      const params = new URL(request.url).searchParams
      const product = findProduct(
        params.get('center_id'),
        params.get('zone_id'),
        params.get('type'),
      )

      if (product) {
        const name = product.phase
          ? isBuildPhase()
            ? product.phase.build
            : product.phase.serve
          : product.fixture
        return fixtureResponse(name)
      }

      const absent = findAbsent(request)
      return absent ? absentResponse(absent) : recordMissing(request)
    }),

    http.get(`${mockNacHost}/v2/public/product/:id`, ({ params, request }) => {
      const name = scenarios.productsById[params.id]
      if (name) return fixtureResponse(name)

      const absent = findAbsent(request)
      return absent ? absentResponse(absent) : recordMissing(request)
    }),

    // Registered last: anything else on these two origins is an unmapped upstream call.
    http.all(`${mockNacHost}/*`, ({ request }) => recordMissing(request)),
    http.all(`${mockAfpHost}/*`, ({ request }) => recordMissing(request)),
  ]
}

/**
 * Requests to any other origin pass through untouched — the browser-side assets a page references
 * (media, widget CDN) are Playwright's job, not this process's.
 *
 * The catch-alls above mean this should be unreachable for NAC/AFP, but it records before erroring
 * anyway: an unrecorded miss would be swallowed into a `NACError` and degrade the page to "Unable
 * to load forecast data", which a careless assertion could still pass.
 */
export function onUnhandledRequest(request, print) {
  if (request.url.startsWith(mockNacHost) || request.url.startsWith(mockAfpHost)) {
    recordMissing(request)
    print.error()
  }
}
