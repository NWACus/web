import type { Page } from '@playwright/test'
import { expect, test } from './fixture'
import { loadPage, stubMapbox, tenant } from './helpers'

/**
 * A native detail page for any station the center's SnowObs token tracks (#1341): the legacy
 * station widget's modal, as a page the map card links to when no station page lists the station.
 *
 * SAC has no station pages, so every station the mocks track is one of these. The tracking list
 * and timeseries come from `mocks/snowobs/`; the timeseries mock answers only the stations a
 * request names, so a page cannot render a station its route should have refused.
 */

const GREEN_LAKE = '/weather/stations/station/snotel/502'

/** Status of a same-origin request made from the page, where `*.localhost` resolves. */
async function statusOf(page: Page, path: string): Promise<number> {
  return page.evaluate(async (url) => (await fetch(url)).status, path)
}

function graphDataPath(stations: string): string {
  const params = new URLSearchParams({
    stations,
    vars: 'air_temp',
    from: '2026-09-10T00:00:00.000Z',
    to: '2026-09-11T00:00:00.000Z',
  })
  return `/weather/graph-data?${params.toString()}`
}

test.describe('Single-station detail page', () => {
  test('a tracked station no page lists has a table in the center timezone', async ({ page }) => {
    const errors = await loadPage(page, `${tenant('sac')}${GREEN_LAKE}`)

    await expect(page.getByRole('heading', { level: 1, name: 'Green Lake' })).toBeVisible()
    // The legacy modal's metadata line: network, elevation and partner.
    await expect(page.getByText('SNOTEL', { exact: true })).toBeVisible()
    await expect(page.getByText("5,920'")).toBeVisible()
    await expect(page.getByText('NRCS')).toBeVisible()

    // 22:00Z is 15:00 Pacific daylight time, SAC's zone.
    const table = page.getByRole('table').first()
    await expect(table).toContainText('09/10 15:00')
    await expect(table).toContainText('PDT')

    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/)
    expect(errors).toEqual([])
  })

  test('its graphs and download read the one station', async ({ page }) => {
    const graphData = page.waitForResponse((response) =>
      response.url().includes('/weather/graph-data'),
    )
    const errors = await loadPage(page, `${tenant('sac')}${GREEN_LAKE}?range=graphs`)
    expect((await graphData).status()).toBe(200)
    await expect(page.getByText(/Couldn't load station data/)).toHaveCount(0)

    await loadPage(page, `${tenant('sac')}${GREEN_LAKE}?range=csv`)
    await expect(page.getByLabel('Datalogger')).toContainText("Green Lake, 5920'")
    await expect(page.getByRole('button', { name: 'Download CSV' })).toBeAttached()
    expect(errors).toEqual([])
  })

  test('an untracked or mismatched station is a 404', async ({ page }) => {
    // A stid our token could read, but that SAC does not track.
    const untracked = await page.goto(`${tenant('sac')}/weather/stations/station/mesowest/KSEA`)
    expect(untracked?.status()).toBe(404)

    // A tracked stid under the wrong source is a different station.
    const mismatched = await page.goto(`${tenant('sac')}/weather/stations/station/nwac/502`)
    expect(mismatched?.status()).toBe(404)
  })

  test('the data routes serve tracked stations and refuse the rest', async ({ page }) => {
    await loadPage(page, `${tenant('sac')}${GREEN_LAKE}?range=csv`)

    expect(await statusOf(page, graphDataPath('snotel:502'))).toBe(200)
    expect(await statusOf(page, graphDataPath('mesowest:KSEA'))).toBe(400)
    expect(await statusOf(page, graphDataPath('snotel:502,mesowest:KSEA'))).toBe(400)

    const csv = (path: string, station: string, year: number) =>
      `${path}/csv?${new URLSearchParams({ station, year: String(year) }).toString()}`
    expect(
      await statusOf(page, csv('/weather/stations/station/mesowest/KSEA', 'mesowest:KSEA', 2026)),
    ).toBe(404)
    // The datalogger must be the page's own station, whatever else is tracked.
    expect(await statusOf(page, csv(GREEN_LAKE, 'nwac:57', 2026))).toBe(400)
    expect(await statusOf(page, csv(GREEN_LAKE, 'snotel:502', 2015))).toBe(400)
  })

  test('the station map links a station no page lists to its detail page', async ({ page }) => {
    await stubMapbox(page)
    await loadPage(page, `${tenant('sac')}/weather/stations/map`)

    // The map's text list carries the same links as the station cards.
    await expect(page.getByRole('link', { name: 'Green Lake' })).toHaveAttribute('href', GREEN_LAKE)
    await expect(page.getByRole('link', { name: 'CW6318 Welches' })).toHaveAttribute(
      'href',
      '/weather/stations/station/mesowest/C6318',
    )
  })
})
