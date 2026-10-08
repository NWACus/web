import type { Page } from '@playwright/test'
import { expect, test } from './fixture'
import { ZONE, loadPage, tenant, zoneSlug } from './helpers'

const SLUG = zoneSlug(ZONE.forecast)
const ZONE_PATH = `/forecasts/avalanche/${SLUG}`
const DATED_PATH = `${ZONE_PATH}/2026-04-05`

// The corpus forecast's bottom line is `<p><em>Refer to the Galena Summit &amp; Eastern Mtns …`.
const BOTTOM_LINE_TEXT =
  "Refer to the Galena Summit & Eastern Mtns forecast if you're traveling in the western half of this zone—including the Warm Springs Ck drainage—or in the mountains north or east of Ketchum."

function ogContent(page: Page, property: string): Promise<string | null> {
  return page.locator(`meta[property="${property}"]`).first().getAttribute('content')
}

function descriptionContent(page: Page): Promise<string | null> {
  return page.locator('meta[name="description"]').getAttribute('content')
}

test.describe('Link previews', () => {
  test('a zone page describes itself with the bottom line as plain text', async ({ page }) => {
    await loadPage(page, `${tenant('snfac')}${ZONE_PATH}`)

    expect(await descriptionContent(page)).toBe(BOTTOM_LINE_TEXT)
    expect(await ogContent(page, 'og:description')).toBe(BOTTOM_LINE_TEXT)
  })

  test('a zone preview image is versioned by its forecast and cached briefly', async ({ page }) => {
    await loadPage(page, `${tenant('snfac')}${ZONE_PATH}`)

    const image = await ogContent(page, 'og:image')
    expect(image).not.toBeNull()
    const imageUrl = new URL(image ?? '')
    expect(imageUrl.pathname).toBe('/api/snfac/og')
    expect(imageUrl.searchParams.get('route')).toBe(ZONE_PATH.slice(1))
    expect(imageUrl.searchParams.get('v')).toMatch(/^[0-9a-f]{16}$/)

    // Fetched through the tenant origin the page is served from; og:image's host is the
    // tenant's public hostname, which only resolves in Chromium.
    const response = await page.request.get(
      `${tenant('snfac')}${imageUrl.pathname}${imageUrl.search}`,
    )
    expect(response.status()).toBe(200)
    expect(response.headers()['content-type']).toBe('image/png')
    expect(response.headers()['cache-control']).toBe('public, max-age=300, s-maxage=300')
  })

  test('a widget center still gets a zone preview image', async ({ page }) => {
    // The widget page reads no forecast, so its version comes from the map layer — which the
    // corpus has only for SNFAC (blocked on map_layer_NWAC), so here it degrades to unversioned.
    await loadPage(page, `${tenant('dvac')}/forecasts/avalanche/olympics`)

    const imageUrl = new URL((await ogContent(page, 'og:image')) ?? '')
    expect(imageUrl.pathname).toBe('/api/dvac/og')
    expect(imageUrl.searchParams.get('route')).toBe('forecasts/avalanche/olympics')
  })

  test('an archived forecast previews as its own dated page', async ({ page }) => {
    await loadPage(page, `${tenant('snfac')}${DATED_PATH}`)

    const title = await page.title()
    expect(title).toBe('Soldier & Wood River Valley Mtns - Avalanche Forecast for April 5, 2026')
    expect(await ogContent(page, 'og:title')).toBe(title)
    expect(new URL((await ogContent(page, 'og:url')) ?? '').pathname).toBe(DATED_PATH)
    expect(await ogContent(page, 'og:description')).toBe(BOTTOM_LINE_TEXT)

    // The center's default card, never the zone image, which draws today's danger.
    const imageUrl = new URL((await ogContent(page, 'og:image')) ?? '')
    expect(imageUrl.pathname).toBe('/api/snfac/og')
    expect(imageUrl.searchParams.get('route')).toBeNull()

    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/)
  })
})
