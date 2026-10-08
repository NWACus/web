import type { Page } from '@playwright/test'
import { expect, test } from './fixture'
import { ZONE, tenant, zoneSlug } from './helpers'

/**
 * The routes export `main`'s rebuild window, and a native render lowers its own to 5 min through
 * its 300s product fetch. Only this spec holds that split: moving a native read into
 * `unstable_cache` would silently put a native page on the widget's window.
 * See "Rebuild cadence" in docs/afp-products/architecture.md.
 *
 * Skips itself while the layout's 60s announcements cache (#1292) caps every page below these
 * windows, and starts asserting once that is fixed.
 */

const NATIVE_WINDOW = 300
/** The zone page's literal on `main`, and the map layer's data-cache window. */
const WIDGET_ZONE_WINDOW = 1800
/** The window `getActiveAnnouncements` imposes on every `[center]` page until #1292. */
const ANNOUNCEMENTS_FLOOR = 60

function sMaxAge(cacheControl: string | undefined): number {
  // `s-maxage=<seconds>` from e.g. "s-maxage=300, stale-while-revalidate=31535700"
  const match = cacheControl?.match(/s-maxage=(\d+)/)
  if (!match) throw new Error(`No s-maxage in Cache-Control: ${cacheControl}`)
  return Number(match[1])
}

async function windowOf(page: Page, url: string): Promise<number> {
  const response = await page.goto(url)
  expect(response?.status()).toBe(200)
  return sMaxAge(response?.headers()['cache-control'])
}

test.describe('Rebuild cadence', () => {
  test.beforeEach(async ({ page }) => {
    // dvac's home page has no native product and a 3600s literal, so 60 can only be the floor.
    const home = await windowOf(page, tenant('dvac'))
    test.skip(home === ANNOUNCEMENTS_FLOOR, 'Announcements cap every page at 60s until #1292')
  })

  test('the zone page rebuilds every 5 min native and every 30 min on the widget', async ({
    page,
  }) => {
    const native = `${tenant('snfac')}/forecasts/avalanche/${zoneSlug(ZONE.forecast)}`
    expect(await windowOf(page, native)).toBe(NATIVE_WINDOW)
    expect(await windowOf(page, `${tenant('dvac')}/forecasts/avalanche/olympics`)).toBe(
      WIDGET_ZONE_WINDOW,
    )
  })

  test('the all-zones grid rebuilds every 5 min native and stays static on the widget', async ({
    page,
  }) => {
    expect(await windowOf(page, `${tenant('snfac')}/forecasts/avalanche`)).toBe(NATIVE_WINDOW)
    expect(await windowOf(page, `${tenant('dvac')}/forecasts/avalanche`)).toBeGreaterThan(
      WIDGET_ZONE_WINDOW,
    )
  })

  test('Mountain Weather rebuilds every 5 min native and stays static on the widget', async ({
    page,
  }) => {
    expect(await windowOf(page, `${tenant('nwac')}/weather/forecast`)).toBe(NATIVE_WINDOW)
    // SNFAC's weather flag is seeded on, but native weather is limited to NWAC for now.
    for (const center of ['snfac', 'sac']) {
      expect(await windowOf(page, `${tenant(center)}/weather/forecast`)).toBeGreaterThan(
        WIDGET_ZONE_WINDOW,
      )
    }
  })
})
