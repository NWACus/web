import { expect, test } from './fixture'
import { loadPage, stubMapbox, tenant } from './helpers'

/**
 * Inventory row S1 — the native weather station map, and its rollout flag.
 *
 * Every tenant but dvac is seeded native for the station map (sac is the one whose alternate-zones
 * KML the mocks serve) and dvac stays on the widget; both states are read, never written. The map
 * itself is a Mapbox canvas — what a browser can assert on is everything around it: the toolbar,
 * and the station list the map publishes as text for readers who can't see the canvas, which is
 * fed by the same data the markers are.
 */

const PHONE = { width: 375, height: 812 }

test.describe('Native vs widget station map', () => {
  test('a widget tenant renders the embedded stations widget', async ({ page }) => {
    const errors = await loadPage(page, `${tenant('dvac')}/weather/stations/map`)

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

    // Mapbox stamps role="img" / aria-label="Map marker" on every element it is handed as a
    // marker, so MapMarker hands it one that is already hidden: the list above is how this
    // content reaches a reader who can't see the canvas, not a few hundred nameless graphics.
    await expect(page.locator('.mapboxgl-marker').first()).toBeAttached()
    await expect(page.getByRole('img', { name: 'Map marker' })).toHaveCount(0)

    // SAC groups stations by its own KML zones rather than its single forecast zone: the filter
    // lists the KML's placemarks and Other, as the widget does.
    // Role locators skip the hidden drawer's copy of each option; label locators would find both.
    await page.getByRole('button', { name: 'Zone' }).click()
    await expect(page.getByRole('checkbox', { name: 'Sierra Crest North' })).toBeVisible()
    await expect(page.getByRole('checkbox', { name: 'Carson Range' })).toBeVisible()
    await expect(page.getByRole('checkbox', { name: 'Other' })).toBeVisible()
    await expect(page.getByRole('checkbox', { name: 'Central Sierra Nevada' })).toHaveCount(0)

    expect(errors).toEqual([])
  })

  test('at phone width the filters collapse behind one button', async ({ page }) => {
    await stubMapbox(page)
    await page.setViewportSize(PHONE)
    await loadPage(page, `${tenant('sac')}/weather/stations/map`)

    await expect(page.getByRole('button', { name: 'Open filters' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Station Labels' })).toBeHidden()

    // Nothing pushes the page wider than the phone.
    const width = await page.evaluate(() => document.documentElement.scrollWidth)
    expect(width).toBeLessThanOrEqual(PHONE.width)
  })
})
