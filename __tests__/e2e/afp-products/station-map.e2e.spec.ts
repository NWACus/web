import { expect, test } from './fixture'
import { loadPage, tenant } from './helpers'

/**
 * Inventory row S1 — the native weather station map, and its rollout flag.
 *
 * sac is seeded native for the station map and nwac stays on the widget; both are read, never
 * written. The map itself is a Mapbox canvas — what a browser can assert on is everything around
 * it: the toolbar, and the station list the map publishes as text for readers who can't see the
 * canvas, which is fed by the same data the markers are.
 */

const PHONE = { width: 375, height: 812 }

/** The smallest style Mapbox GL accepts: it draws nothing, and asks for no tiles. */
const EMPTY_STYLE = JSON.stringify({ version: 8, sources: {}, layers: [] })

/**
 * Mapbox's style, tiles and telemetry are the browser's own requests; keep them off the network.
 * The style has to be a real (empty) style — Mapbox throws on a malformed one, and that would
 * surface as a page error unrelated to what the spec is checking.
 */
async function stubMapbox(page: Parameters<typeof loadPage>[0]) {
  await page.route('**/api.mapbox.com/**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: route.request().url().includes('/styles/v1/') ? EMPTY_STYLE : '{}',
    }),
  )
  await page.route('**/events.mapbox.com/**', (route) => route.fulfill({ status: 204, body: '' }))
}

test.describe('Native vs widget station map', () => {
  test('a widget tenant renders the embedded stations widget', async ({ page }) => {
    const errors = await loadPage(page, `${tenant('nwac')}/weather/stations/map`)

    await expect(page.locator('#widget-container[data-widget="stations"]')).toBeVisible()
    await expect(page.getByTestId('station-map')).toHaveCount(0)
    expect(errors).toEqual([])
  })

  test('a native tenant renders the map with the stations SnowObs returned', async ({ page }) => {
    await stubMapbox(page)
    const errors = await loadPage(page, `${tenant('sac')}/weather/stations/map`)

    await expect(page.getByTestId('station-map')).toBeVisible()
    await expect(page.locator('#widget-container')).toHaveCount(0)
    await expect(page.getByRole('button', { name: 'Station Labels' })).toBeVisible()

    // The accessible list carries every station the endpoint mapped, whether or not the canvas
    // could draw; a fixture station outside every zone still lists.
    const list = page.getByRole('list').filter({ hasText: 'White Chuck Mountain' })
    await expect(list).toBeAttached()
    await expect(list).toContainText('Green Lake')
    // The fixture's fourth station has no coordinates and must not be listed.
    await expect(list).not.toContainText('No Coordinates')

    // SAC groups stations by its own KML zones rather than its single forecast zone: the filter
    // lists the KML's placemarks and Other, as the widget does.
    await page.getByRole('button', { name: 'Zone' }).click()
    await expect(page.getByLabel('Sierra Crest North')).toBeVisible()
    await expect(page.getByLabel('Carson Range')).toBeVisible()
    await expect(page.getByLabel('Other')).toBeVisible()
    await expect(page.getByLabel('Central Sierra Nevada')).toHaveCount(0)

    expect(errors).toEqual([])
  })

  test('at phone width the filters collapse behind one button', async ({ page }) => {
    await stubMapbox(page)
    await page.setViewportSize(PHONE)
    await loadPage(page, `${tenant('sac')}/weather/stations/map`)

    await expect(page.getByRole('button', { name: 'Filters' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Station Labels' })).toBeHidden()

    // Nothing pushes the page wider than the phone.
    const width = await page.evaluate(() => document.documentElement.scrollWidth)
    expect(width).toBeLessThanOrEqual(PHONE.width)
  })
})
