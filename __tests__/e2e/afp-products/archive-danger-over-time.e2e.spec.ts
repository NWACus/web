import type { Download } from '@playwright/test'
import { readFile } from 'fs/promises'

import { expect, test } from './fixture'
import { loadPage, tenant } from './helpers'

/** The bytes a download actually wrote, from the temp path Playwright saved it to. */
async function readDownload(download: Download): Promise<Buffer> {
  const path = await download.path()
  if (!path) throw new Error('download produced no file')
  return readFile(path)
}

const PNG_MAGIC = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])

/** A PNG's pixel size, from the IHDR chunk that has to be its first. */
function pngSize(png: Buffer): { width: number; height: number } {
  if (!png.subarray(0, 8).equals(PNG_MAGIC)) throw new Error('not a PNG')
  return { width: png.readUInt32BE(16), height: png.readUInt32BE(20) }
}

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

    await page.getByRole('button', { name: 'Download Banner Summit chart' }).click()
    const downloadPromise = page.waitForEvent('download')
    await page.getByRole('menuitem', { name: 'PNG image' }).click()
    const download = await downloadPromise

    expect(download.suggestedFilename()).toBe(
      'banner-summit-danger-over-time-2026-04-05-to-2026-04-05.png',
    )

    // A real PNG of the plot, not an empty or truncated file. Whether the zone's name is drawn
    // into it is asserted in the unit test, which can see the option the export renders from.
    const { width, height } = pngSize(await readDownload(download))
    expect(width).toBeGreaterThan(height)
    expect(height).toBeGreaterThan(100)
  })

  test('downloads a zone chart as a CSV of its rated days', async ({ page }) => {
    await loadPage(page, `${DANGER_URL}${SEASON}&zone=banner-summit`)
    await expect(page.locator('canvas')).toHaveCount(1)

    await page.getByRole('button', { name: 'Download Banner Summit chart' }).click()
    const downloadPromise = page.waitForEvent('download')
    await page.getByRole('menuitem', { name: 'CSV data' }).click()
    const download = await downloadPromise

    expect(download.suggestedFilename()).toBe(
      'banner-summit-danger-over-time-2026-04-05-to-2026-04-05.csv',
    )
    // The corpus holds one rated day for this zone: Apr 5, Moderate.
    expect((await readDownload(download)).toString('utf8')).toBe(
      'date,danger_level,danger_rating\n2026-04-05,2,Moderate\n',
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

    // The one rated day fills the extent, so its Moderate bar spans the plot's width. The plot
    // ends 92px up from the bottom (the date labels and the zoom slider), and a Moderate bar
    // covers the lower two fifths of it, so just above the axis is on the bar and clear of the
    // slider.
    const box = await canvas.boundingBox()
    if (!box) throw new Error('chart canvas has no box')
    await canvas.click({ position: { x: box.width / 2, y: box.height - 100 } })

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
