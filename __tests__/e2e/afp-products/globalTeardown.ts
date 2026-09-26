import { missingFixtures } from './mockState'

/**
 * Fail the run when a test triggered an upstream call the mock could not answer, even if every
 * assertion passed. These pages degrade to visible copy rather than crashing, so a missing golden
 * is exactly the kind of defect a green suite would otherwise hide.
 */
export default function globalTeardown() {
  const missing = missingFixtures()
  if (missing.length > 0) {
    throw new Error(
      'Tests triggered upstream calls with no golden behind them:\n  - ' +
        `${missing.join('\n  - ')}\n` +
        'Map them in __tests__/e2e/mocks/scenarios.json, or declare the gap under "absent".',
    )
  }
}
