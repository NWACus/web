import type { Page } from '@playwright/test'
import { expect, test } from './fixture'
import { ZONE, loadPage, tenant, zoneSlug } from './helpers'

const SLUG = zoneSlug(ZONE.forecast)
const ZONE_PATH = `/forecasts/avalanche/${SLUG}`
const DATED_PATH = `${ZONE_PATH}/2026-04-05`

const LIVE_CACHE_CONTROL = 'public, max-age=300, s-maxage=300'
const SETTLED_DAY_CACHE_CONTROL = 'public, max-age=86400, s-maxage=86400'

// The corpus forecast's bottom line is `<p><em>Refer to the Galena Summit &amp; Eastern Mtns …`.
const BOTTOM_LINE_TEXT =
  "Refer to the Galena Summit & Eastern Mtns forecast if you're traveling in the western half of this zone—including the Warm Springs Ck drainage—or in the mountains north or east of Ketchum."

function ogContent(page: Page, property: string): Promise<string | null> {
  return page.locator(`meta[property="${property}"]`).first().getAttribute('content')
}

function descriptionContent(page: Page): Promise<string | null> {
  return page.locator('meta[name="description"]').getAttribute('content')
}

async function ogImageUrl(page: Page): Promise<URL> {
  return new URL((await ogContent(page, 'og:image')) ?? '')
}

/**
 * Fetch an OG image through the tenant origin the page is served from (og:image's host is the
 * tenant's public hostname, which only resolves in Chromium) and check what it answers.
 */
async function expectPng(page: Page, pathAndQuery: string, cacheControl: string): Promise<void> {
  const response = await page.request.get(`${tenant('snfac')}${pathAndQuery}`)
  expect(response.status()).toBe(200)
  expect(response.headers()['content-type']).toBe('image/png')
  expect(response.headers()['cache-control']).toBe(cacheControl)
}

test.describe('Link previews', () => {
  test('a zone page is titled with the center short name', async ({ page }) => {
    await loadPage(page, `${tenant('snfac')}${ZONE_PATH}`)

    const title = 'Soldier & Wood River Valley Mtns - Avalanche Forecast | SNFAC'
    await expect(page).toHaveTitle(title)
    expect(await ogContent(page, 'og:title')).toBe(title)
  })

  test('a zone page describes itself with the bottom line as plain text', async ({ page }) => {
    await loadPage(page, `${tenant('snfac')}${ZONE_PATH}`)

    expect(await descriptionContent(page)).toBe(BOTTOM_LINE_TEXT)
    expect(await ogContent(page, 'og:description')).toBe(BOTTOM_LINE_TEXT)
  })

  test('a zone preview image is versioned by its forecast and cached briefly', async ({ page }) => {
    await loadPage(page, `${tenant('snfac')}${ZONE_PATH}`)

    const imageUrl = await ogImageUrl(page)
    expect(imageUrl.pathname).toBe('/api/snfac/og')
    expect(imageUrl.searchParams.get('route')).toBe(ZONE_PATH.slice(1))
    expect(imageUrl.searchParams.get('v')).toMatch(/^[0-9a-f]{16}$/)

    await expectPng(page, `${imageUrl.pathname}${imageUrl.search}`, LIVE_CACHE_CONTROL)
  })

  test('a widget center still gets a zone preview image', async ({ page }) => {
    // The widget page reads no forecast, so its version comes from the map layer — which the
    // corpus has only for SNFAC (blocked on map_layer_NWAC), so here it degrades to unversioned.
    await loadPage(page, `${tenant('dvac')}/forecasts/avalanche/olympics`)

    const imageUrl = await ogImageUrl(page)
    expect(imageUrl.pathname).toBe('/api/dvac/og')
    expect(imageUrl.searchParams.get('route')).toBe('forecasts/avalanche/olympics')
  })

  test('an archived forecast previews as its own dated page', async ({ page }) => {
    await loadPage(page, `${tenant('snfac')}${DATED_PATH}`)

    const title = await page.title()
    expect(title).toBe(
      'Soldier & Wood River Valley Mtns - Archived Avalanche Forecast for April 5, 2026',
    )
    expect(await ogContent(page, 'og:title')).toBe(title)
    expect(new URL((await ogContent(page, 'og:url')) ?? '').pathname).toBe(DATED_PATH)
    expect(await ogContent(page, 'og:description')).toBe(BOTTOM_LINE_TEXT)

    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/)
  })

  test("an archived forecast's image is the zone card for that day, held for a day", async ({
    page,
  }) => {
    await loadPage(page, `${tenant('snfac')}${DATED_PATH}`)

    // The route carries the date, so the card reads that day's map layer, not today's. The corpus
    // has no dated map layer (the mock answers any `day=` with the live one), so which rating it
    // draws is pinned by the unit tests; this pins the address and the cache window.
    const imageUrl = await ogImageUrl(page)
    expect(imageUrl.pathname).toBe('/api/snfac/og')
    expect(imageUrl.searchParams.get('route')).toBe(DATED_PATH.slice(1))
    expect(imageUrl.searchParams.get('v')).toBeNull()

    await expectPng(page, `${imageUrl.pathname}${imageUrl.search}`, SETTLED_DAY_CACHE_CONTROL)
  })

  test('a dated image route with an unusable date falls back on the short window', async ({
    page,
  }) => {
    const route = encodeURIComponent(`${ZONE_PATH.slice(1)}/2999-01-01`)
    await expectPng(page, `/api/snfac/og?route=${route}`, LIVE_CACHE_CONTROL)
  })
})
