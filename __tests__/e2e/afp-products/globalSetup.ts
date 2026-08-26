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
 * collector then reports as a page failure. Bodies are consumed so each request is genuinely
 * finished before the next begins.
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
    await fetch(`http://${slug}.localhost:${port}${path}`)
      .then((response) => response.text())
      .catch(() => undefined)
  }
}
