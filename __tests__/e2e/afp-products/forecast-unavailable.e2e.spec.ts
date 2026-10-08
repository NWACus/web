import type { Page } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { expect, test } from './fixture'
import { hasFixture, loadPage, tenant } from './helpers'
import { repoRoot } from './mockState'

/**
 * Forecast-176 — what the live zone page shows when it has no forecast to show.
 *
 * Two states, told apart: nothing displayable published ("The requested product doesn't exist",
 * the widget's wording) and a read that failed (the outage wording). Both offer the Current Forecast
 * and the Forecast Archive, and both keep asking the freshness route, so a first publish still
 * reaches an open tab.
 */

/** v2's 200 all-null placeholder for a real zone with nothing published. */
const NOTHING_PUBLISHED_FIXTURE = 'v2_public_product_forecast_null.json'
const NOTHING_PUBLISHED_BLOCKED =
  "Blocked on products-api Case product_forecast_nothing_published — the corpus has no capture of v2's all-null placeholder for a zone with nothing published"

/** The tenant and zone slug a scenario serves `fixture` at, if any. */
function zoneServing(fixture: string): { tenantSlug: string; zoneSlug: string } | undefined {
  const parsed: unknown = JSON.parse(
    readFileSync(join(repoRoot, '__tests__/e2e/mocks/scenarios.json'), 'utf8'),
  )
  if (!parsed || typeof parsed !== 'object' || !('products' in parsed)) return undefined
  if (!Array.isArray(parsed.products)) return undefined

  for (const product of parsed.products) {
    if (product?.fixture === fixture && typeof product.zoneSlug === 'string') {
      return { tenantSlug: String(product.center).toLowerCase(), zoneSlug: product.zoneSlug }
    }
  }
  return undefined
}

async function expectWayOnLinks(page: Page) {
  await expect(page.getByRole('link', { name: 'Current Forecast' })).toHaveAttribute(
    'href',
    '/forecasts/avalanche',
  )
  await expect(page.getByRole('link', { name: 'Forecast Archive' })).toHaveAttribute(
    'href',
    '/forecasts/avalanche/archive',
  )
}

test.describe('Live zone page with no forecast to show', () => {
  /**
   * The corpus answers every NWAC forecast request with the Slim error page, which does not parse:
   * a failed read. The page keeps its outage wording rather than claiming there is no forecast.
   */
  test('a failed read keeps the outage wording, offers the way on, and keeps checking', async ({
    page,
  }) => {
    // Armed before navigating: RevalidateOnView fires on mount. The fixture aborts the request,
    // which still proves the page asked.
    const freshnessCheck = page.waitForRequest((r) =>
      r.url().includes('/api/nwac/forecast-freshness/olympics/'),
    )
    const errors = await loadPage(page, `${tenant('nwac')}/forecasts/avalanche/olympics`)

    await expect(
      page.getByText('Unable to load forecast data. Please try again later.'),
    ).toBeVisible()
    await expect(page.getByText("The requested product doesn't exist")).toHaveCount(0)
    await expectWayOnLinks(page)
    await freshnessCheck

    expect(errors).toEqual([])
  })

  test("nothing published says the product doesn't exist and offers the way on", async ({
    page,
  }) => {
    const zone = zoneServing(NOTHING_PUBLISHED_FIXTURE)
    test.skip(!hasFixture(NOTHING_PUBLISHED_FIXTURE) || !zone, NOTHING_PUBLISHED_BLOCKED)
    if (!zone) return

    const freshnessCheck = page.waitForRequest((r) => r.url().includes('/forecast-freshness/'))
    const errors = await loadPage(
      page,
      `${tenant(zone.tenantSlug)}/forecasts/avalanche/${zone.zoneSlug}`,
    )

    await expect(
      page.getByRole('heading', { name: "The requested product doesn't exist" }),
    ).toBeVisible()
    await expect(page.getByText(/Unable to load forecast data/)).toHaveCount(0)
    await expectWayOnLinks(page)
    await freshnessCheck

    expect(errors).toEqual([])
  })
})
