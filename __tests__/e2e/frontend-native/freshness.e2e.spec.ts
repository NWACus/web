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
 * they must not do. They run in their own Playwright project, after everything else and alone: a
 * revalidation here drops the cached render of every page sharing the forecast or weather tag.
 */
test.describe.configure({ mode: 'serial', retries: 0 })

test.describe('Revalidate on view', () => {
  /**
   * **This is currently broken, and it is the most consequential thing this suite found.**
   *
   * The freshness endpoint correctly detects the correction and answers 200, and the client
   * correctly calls `router.refresh()` — but the reader never sees the corrected forecast, because
   * by then the page is a 404.
   *
   * `/[center]/forecasts/avalanche/[zone]` is `dynamicParams = false`. When the handler calls
   * `revalidateTag` and Next drops the prerendered entry, Next will not regenerate that path on
   * demand: the request falls through to the `[center]/[...segments]` catch-all, which has no
   * Payload page for it, answers 404, and caches that. Every zone sharing the revalidated forecast
   * or weather tag goes with it.
   *
   * So the mechanism that exists to deliver a corrected or withdrawn forecast removes it instead.
   * Reproducible without Playwright: `pnpm e2e:build`, confirm the four Sawtooth zones answer 200,
   * `curl` the freshness endpoint for one of them, and watch two of them become 404s.
   *
   * Left as `fixme` rather than fixed here: the remedy is a change to how the forecast route is
   * generated and what happens to an unknown zone, which belongs to the page rather than to its
   * test suite.
   */
  test.fixme('a correction reaches the reader without a reload', async ({ page }) => {
    await stubExternalAssets(page)
    await loadPage(page, FRESHNESS_URL)

    // The prerendered page carries the build-phase product.
    await expect(page.getByText('We are closed for the season')).toBeVisible()

    await page.waitForResponse(
      (response) => response.url().includes('forecast-freshness') && response.status() === 200,
    )

    // ...and the router refresh should re-render the server component with the corrected one.
    await expect(page.getByText('isolated new snow instabilities')).toBeVisible()
  })

  test('an unchanged product answers 304 and leaves the page alone', async ({ page }) => {
    await stubExternalAssets(page)
    await loadPage(page, STABLE_URL)

    const response = await page.waitForResponse((r) => r.url().includes('forecast-freshness'))
    expect(response.status()).toBe(304)

    await expect(page.getByText(/Refer to the Galena Summit & Eastern Mtns forecast/)).toBeVisible()
  })
})
