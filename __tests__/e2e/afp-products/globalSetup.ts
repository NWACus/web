import { request } from 'node:http'
import { clearMissingFixtures, missingFixtures, mockServerProblems } from './mockState'

/**
 * Refuse to run unless the server under test is the mocked production build, and unless the build
 * itself covered every upstream call it made.
 */
export default async function globalSetup() {
  const port = process.env.E2E_MOCK_PORT || '3100'

  const problems = mockServerProblems(port)
  if (problems.length > 0) {
    throw new Error(`Mocked E2E preconditions failed:\n  - ${problems.join('\n  - ')}`)
  }

  const missing = missingFixtures()
  if (missing.length > 0) {
    throw new Error(
      'The mocked build made upstream calls with no golden behind them, so the prerendered pages ' +
        'are already degraded. Map them in __tests__/e2e/mocks/scenarios.json (or declare the gap ' +
        `under "absent") and rebuild:\n  - ${missing.join('\n  - ')}`,
    )
  }

  // From here on, anything appended was caused by a test. globalTeardown fails the run on it.
  clearMissingFixtures()

  await warmServer(port)
}

/**
 * Walk every route the suite visits, one at a time, before any worker starts.
 *
 * A cold production server initialises its chunks lazily, and several workers arriving at once has
 * been observed racing that and returning 5xx from the Payload API — which every spec's error
 * collector then reports as a page failure.
 */
async function warmServer(port: string) {
  const routes: [string, string][] = [
    ['snfac', '/api/users/me'],
    ['snfac', '/forecasts/avalanche'],
    ['snfac', '/forecasts/avalanche/banner-summit'],
    ['dvac', '/forecasts/avalanche'],
    ['dvac', '/forecasts/avalanche/olympics'],
    ['nwac', '/forecasts/avalanche/olympics'],
    ['sac', '/forecasts/avalanche'],
    ['sac', '/forecasts/avalanche/central-sierra-nevada'],
  ]

  for (const [slug, path] of routes) {
    await warmRoute(slug, path, port)
  }
}

/**
 * Warm one route, best-effort.
 *
 * Addressed as loopback plus a `Host` header rather than as `slug.localhost`, which resolves only
 * where /etc/hosts says so — not in the Playwright container CI runs this in. There every warm
 * request would fail DNS and be swallowed below, leaving the warm-up inert in the one environment
 * it exists for. `fetch` cannot express this: undici overwrites a caller-supplied `host` header
 * with the URL's own authority.
 */
function warmRoute(slug: string, path: string, port: string): Promise<void> {
  return new Promise((resolve) => {
    const req = request(
      { host: '127.0.0.1', port, path, headers: { host: `${slug}.localhost:${port}` } },
      (res) => {
        // Drained, so the next request genuinely starts after this one finished.
        res.resume()
        res.on('end', resolve)
      },
    )
    req.on('error', () => resolve())
    req.end()
  })
}
