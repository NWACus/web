import { test as base } from '@playwright/test'
import { freezeFreshness, stubExternalAssets } from './helpers'

/**
 * The default fixture for these specs: third-party assets stubbed, and the revalidate-on-view
 * check neutralised.
 *
 * Both are applied automatically rather than per-spec because forgetting either is silent and
 * cross-cutting. A page that reaches the freshness endpoint can purge the cached render of every
 * page sharing its forecast or weather tag — which, given the 404-after-revalidation defect
 * recorded in freshness.e2e.spec.ts, breaks whichever spec happens to run next.
 *
 * `freshness.e2e.spec.ts` is the exception and imports from `@playwright/test` directly.
 */
export const test = base.extend({
  // The second argument is Playwright's "hand this to the test" callback. Named `runTest` rather
  // than the conventional `use` because eslint's rules-of-hooks reads a call to `use()` as a
  // React hook — the same reason __tests__/helpers/mswLifecycle.ts avoids the name.
  page: async ({ page }, runTest) => {
    await stubExternalAssets(page)
    await freezeFreshness(page)
    await runTest(page)
  },
})

export { expect } from '@playwright/test'
