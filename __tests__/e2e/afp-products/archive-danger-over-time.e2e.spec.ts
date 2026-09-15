import { expect, test } from './fixture'
import { loadPage, tenant } from './helpers'

const ARCHIVE_URL = `${tenant('snfac')}/forecasts/avalanche/archive`
const DANGER_URL = `${ARCHIVE_URL}/danger-over-time`

// The corpus archive holds April 2026 products only, which is season 2026 (2025-09-01 through
// 2026-08-31). The browser opens on the current season, so every spec names that season.
const SEASON = '?season=2026'

test.describe('Forecast archive danger-over-time charts', () => {
  test('charts each zone with a rated day, with a download control apiece', async ({ page }) => {
    const errors = await loadPage(page, `${DANGER_URL}${SEASON}`)

    await expect(page.getByRole('heading', { name: 'Forecast Archive' })).toBeVisible()
    // Scoped to the tab bar: the breadcrumb leaf carries the same name.
    await expect(
      page.getByRole('navigation', { name: 'Archive views' }).getByRole('link', {
        name: 'Danger Over Time',
      }),
    ).toHaveAttribute('aria-current', 'page')

    // Two zones carry a Moderate forecast on Apr 5; the third zone's forecast and the
    // all-zones summary are unrated, so they draw no chart (inventory row F8).
    const cards = page.getByRole('list', { name: 'Danger over time by zone' }).getByRole('listitem')
    await expect(cards).toHaveCount(2)
    await expect(page.getByRole('heading', { name: 'Sawtooth & Western Smoky Mtns' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Banner Summit' })).toBeVisible()
    await expect(
      page.getByRole('heading', { name: 'Soldier & Wood River Valley Mtns' }),
    ).toHaveCount(0)

    // ECharts draws to a canvas; one per card once the chart bundle has loaded.
    await expect(page.locator('canvas')).toHaveCount(2)

    expect(errors).toEqual([])
  })

  test('downloads a zone chart as a PNG named for the zone and range', async ({ page }) => {
    await loadPage(page, `${DANGER_URL}${SEASON}`)
    await expect(page.locator('canvas')).toHaveCount(2)

    const downloadPromise = page.waitForEvent('download')
    await page.getByRole('button', { name: 'Download Banner Summit chart as PNG image' }).click()
    const download = await downloadPromise

    expect(download.suggestedFilename()).toBe(
      'banner-summit-danger-over-time-2026-04-05-to-2026-04-05.png',
    )
  })

  test('a bar opens the dated forecast for that zone-day', async ({ page }) => {
    // The corpus holds no product-by-id golden for this zone-day, so the destination is stubbed
    // at the browser and never reaches the mocked upstream. What this asserts is that the bar
    // asks for the right address; the dated page itself is archive.e2e.spec.ts's business.
    await page.route('**/forecasts/avalanche/banner-summit/2026-04-05*', (route) =>
      route.fulfill({ contentType: 'text/html', body: '<!doctype html><title>stub</title>' }),
    )
    await loadPage(page, `${DANGER_URL}${SEASON}&zone=banner-summit`)
    const canvas = page.locator('canvas')
    await expect(canvas).toHaveCount(1)

    // The one rated day fills the extent, so its Moderate bar spans the plot's width and the
    // lower two fifths of its height; a click low in the canvas lands on it.
    const box = await canvas.boundingBox()
    if (!box) throw new Error('chart canvas has no box')
    await canvas.click({ position: { x: box.width / 2, y: box.height * 0.7 } })

    await expect(page).toHaveURL(/\/forecasts\/avalanche\/banner-summit\/2026-04-05$/)
  })

  test('the tabs carry the filters between the list and the charts', async ({ page }) => {
    await loadPage(page, `${ARCHIVE_URL}${SEASON}&zone=banner-summit`)

    await page
      .getByRole('navigation', { name: 'Archive views' })
      .getByRole('link', { name: 'Danger Over Time' })
      .click()

    await expect(page).toHaveURL(
      /\/forecasts\/avalanche\/archive\/danger-over-time\?season=2026&zone=banner-summit$/,
    )
    await expect(page.getByRole('button', { name: 'Remove filter: Banner Summit' })).toBeVisible()
    await expect(
      page.getByRole('list', { name: 'Danger over time by zone' }).getByRole('listitem'),
    ).toHaveCount(1)

    await page.getByRole('link', { name: 'Avalanche Forecasts' }).click()

    await expect(page).toHaveURL(/\/forecasts\/avalanche\/archive\?season=2026&zone=banner-summit$/)
    await expect(page.getByRole('heading', { name: '2 Products' })).toBeVisible()
  })

  test('says so when the matching products carry no rating, rather than going blank', async ({
    page,
  }) => {
    await loadPage(page, `${DANGER_URL}${SEASON}&danger=0`)

    await expect(page.getByText('No danger ratings to chart')).toBeVisible()
  })

  test('a center still on the widget gets the widget chart tab at the same address', async ({
    page,
  }) => {
    await loadPage(page, `${tenant('sac')}/forecasts/avalanche/archive/danger-over-time`)

    // The legacy danger-over-time tab is a hash route inside the forecast widget.
    await expect(page).toHaveURL(/#\/archive\/visual$/)
  })
})
