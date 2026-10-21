import type { Page } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { expect, test } from './fixture'
import { loadPage, tenant } from './helpers'
import { repoRoot } from './mockState'

/**
 * Forecast-176 — what the live zone page shows when it has no forecast to show.
 *
 * Two states, told apart: nothing displayable published ("The requested product doesn't exist",
 * the widget's wording) and a read that failed (the outage wording). Both offer the Current Forecast
 * and the Forecast Archive, and both keep asking the freshness route, so a first publish still
 * reaches an open tab.
 */

/** v2's 200 all-null placeholder for a real zone with nothing published (a provisional capture). */
const NOTHING_PUBLISHED_FIXTURE = 'v2_public_product_forecast_null.json'

/** The tenant and zone slug a scenario serves `fixture` at, so the spec can't drift from the mock. */
function zoneServing(fixture: string): { tenantSlug: string; zoneSlug: string } {
  const parsed: unknown = JSON.parse(
    readFileSync(join(repoRoot, '__tests__/e2e/mocks/scenarios.json'), 'utf8'),
  )
  const products =
    parsed && typeof parsed === 'object' && 'products' in parsed && Array.isArray(parsed.products)
      ? parsed.products
      : []

  for (const product of products) {
    if (product?.fixture === fixture && typeof product.zoneSlug === 'string') {
      return { tenantSlug: String(product.center).toLowerCase(), zoneSlug: product.zoneSlug }
    }
  }
  throw new Error(`No scenario serves ${fixture}`)
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
   * The corpus answers NWAC forecast requests (bar the one zone mapped to the placeholder below)
   * with the Slim error page, which does not parse: a failed read. The page keeps its outage wording rather than claiming there is no forecast.
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
    const freshnessCheck = page.waitForRequest((r) =>
      r.url().includes(`/forecast-freshness/${zone.zoneSlug}/`),
    )
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
