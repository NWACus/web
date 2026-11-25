import type { Page } from '@playwright/test'
import { expect, test } from './fixture'
import { ZONE, tenant, zoneSlug } from './helpers'

/**
 * The routes export `main`'s rebuild window, and a native render lowers its own to 5 min through
 * its 300s product fetch. The zone page is 5 min on the widget too, through its map-layer fetch,
 * which keeps link previews current. Only this spec holds that split: moving a native read into
 * `unstable_cache` would silently put a native page on the widget's window.
 * See "Rebuild cadence" in docs/afp-products/architecture.md.
 */

const NATIVE_WINDOW = 300
/** The map layer's data-cache window. */
const WIDGET_ZONE_WINDOW = 300
/** The content routes' literal. */
const CONTENT_WINDOW = 3600

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
  // dvac's home page has no native product, so anything lower is a short-window read that has
  // crept into the shared layout (announcements did this: see docs/revalidation.md).
  test('a content page rebuilds on its declared window', async ({ page }) => {
    expect(await windowOf(page, tenant('dvac'))).toBe(CONTENT_WINDOW)
  })

  test('the zone page rebuilds every 5 min, native and on the widget', async ({ page }) => {
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
      CONTENT_WINDOW,
    )
  })

  test('Mountain Weather rebuilds every 5 min native and stays static on the widget', async ({
    page,
  }) => {
    expect(await windowOf(page, `${tenant('snfac')}/weather/forecast`)).toBe(NATIVE_WINDOW)
    expect(await windowOf(page, `${tenant('nwac')}/weather/forecast`)).toBe(NATIVE_WINDOW)
    expect(await windowOf(page, `${tenant('sac')}/weather/forecast`)).toBeGreaterThan(
      CONTENT_WINDOW,
    )
  })
})
