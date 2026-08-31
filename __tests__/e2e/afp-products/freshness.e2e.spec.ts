import { expect, test } from '@playwright/test'
import { ZONE, loadPage, stubExternalAssets, tenant, zoneSlug } from './helpers'

const FRESHNESS_URL = `${tenant('snfac')}/forecasts/avalanche/${zoneSlug(ZONE.freshness)}`
const STABLE_URL = `${tenant('snfac')}/forecasts/avalanche/${zoneSlug(ZONE.forecast)}`

/**
 * Inventory row X5 — a corrected or withdrawn forecast reaches readers immediately.
 *
 * Pre-generating pages is what creates this obligation: the page a reader is handed was rendered
 * minutes ago, so a correction has to arrive without them reloading. The mock serves this one zone
 * a different product during the build than at request time, which is the shape of a correction
 * published after the page was rendered.
 *
 * These specs do NOT use the shared fixture, because freezing the freshness check is the one thing
 * they must not do. They run in their own Playwright project, after everything else and alone,
 * because a revalidation here drops the cached render of every page sharing the revalidated
 * forecast or weather tag — those pages regenerate, but with the *corrected* product, which is not
 * what a spec that ran earlier asserted against.
 *
 * No retries, for the same reason: the correction is one-way. A second attempt would open on a page
 * that already carries it, and the first assertion below would be false.
 */
test.describe.configure({ mode: 'serial', retries: 0 })

test.describe('Revalidate on view', () => {
  /**
   * The whole point of row X5, and the assertion that caught the zone route being unable to
   * regenerate after a tag revalidation — which turned a correction into a ~70s 404 on every zone
   * sharing the revalidated forecast or weather tag. It is `dynamicParams` on that route that
   * makes this pass; if this starts failing again, check there first.
   */
  test('a correction reaches the reader without a reload', async ({ page }) => {
    await stubExternalAssets(page)
    // Armed before navigating: RevalidateOnView fires on mount, and hydration can finish before
    // `page.goto` returns — a wait registered afterwards would miss that first check outright.
    // (It also re-checks on visibility and on a slow interval, but neither fires inside a spec.)
    const freshnessCheck = page.waitForResponse((r) => r.url().includes('forecast-freshness'))
    await loadPage(page, FRESHNESS_URL)

    // The prerendered page carries the build-phase product.
    await expect(page.getByText('We are closed for the season')).toBeVisible()

    // Every answer is a 200 now; which of the three it is lives in the body.
    expect(await (await freshnessCheck).json()).toMatchObject({ changed: true })

    // ...and the router refresh should re-render the server component with the corrected one.
    await expect(page.getByText('isolated new snow instabilities')).toBeVisible()
  })

  test('an unchanged product reports no change and leaves the page alone', async ({ page }) => {
    await stubExternalAssets(page)
    // Armed before navigating, for the same reason as above.
    const freshnessCheck = page.waitForResponse((r) => r.url().includes('forecast-freshness'))
    await loadPage(page, STABLE_URL)

    const response = await freshnessCheck
    expect(response.status()).toBe(200)
    // `changed: false` with no `reason` — the one cacheable answer. An indeterminate answer would
    // also leave the page alone, so asserting the body rather than the status is what separates
    // "the viewer is current" from "we could not establish the product".
    expect(await response.json()).toEqual({ changed: false })
    expect(response.headers()['cache-control']).toContain('s-maxage=')

    await expect(page.getByText(/Refer to the Galena Summit & Eastern Mtns forecast/)).toBeVisible()
  })
})
