import { expect, test } from './fixture'
import { loadPage, tenant } from './helpers'

const ARCHIVE_URL = `${tenant('snfac')}/forecasts/avalanche/archive`
const WEATHER_URL = `${ARCHIVE_URL}/mountain-weather`

// The corpus archive holds April 2026 products only, which is season 2026 (2025-09-01 through
// 2026-08-31). The browser opens on the current season, so every spec names that season.
const SEASON = '?season=2026'

/** The archive's Mountain Weather tab and the archived products it opens (inventory row F8). */
test.describe('Forecast archive mountain weather', () => {
  test('lists the season’s weather products, each linking to the product by id', async ({
    page,
  }) => {
    const errors = await loadPage(page, `${WEATHER_URL}${SEASON}`)

    await expect(page.getByRole('heading', { name: 'Forecast Archive' })).toBeVisible()
    await expect(
      page.getByRole('navigation', { name: 'Archive views' }).getByRole('link', {
        name: 'Mountain Weather',
      }),
    ).toHaveAttribute('aria-current', 'page')

    // One weather product among the corpus's five, covering all four zones: one row, not four.
    await expect(page.getByRole('heading', { name: '1 Product' })).toBeVisible()
    const rows = page.getByRole('list', { name: 'Archived mountain weather' }).getByRole('listitem')
    await expect(rows).toHaveCount(1)
    await expect(
      page.getByRole('link', { name: /Apr 6, 2026.*All Zones.*Test Forecaster B/ }),
    ).toHaveAttribute('href', '/forecasts/avalanche/archive/mountain-weather/184563')

    // Weather carries no rating and covers every zone: no tally, and only the date filter.
    await expect(page.getByRole('list', { name: 'Products by danger rating' })).toHaveCount(0)
    await expect(page.getByRole('checkbox', { name: 'Banner Summit' })).toHaveCount(0)

    expect(errors).toEqual([])
  })

  test('ignores the zone and danger filters carried over from the other tabs', async ({ page }) => {
    await loadPage(page, `${WEATHER_URL}${SEASON}&zone=banner-summit&danger=2`)

    await expect(page.getByRole('heading', { name: '1 Product' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Remove filter: Banner Summit' })).toHaveCount(0)

    // …but carries them back, so returning to the list keeps the reader's selection.
    await expect(
      page.getByRole('navigation', { name: 'Archive views' }).getByRole('link', {
        name: 'Avalanche Forecasts',
      }),
    ).toHaveAttribute(
      'href',
      '/forecasts/avalanche/archive?season=2026&zone=banner-summit&danger=2',
    )
  })

  test('a row opens the archived product, marked as archived', async ({ page }) => {
    await loadPage(page, `${WEATHER_URL}${SEASON}`)

    await page.getByRole('link', { name: /Apr 6, 2026/ }).click()

    await expect(page).toHaveURL(/\/forecasts\/avalanche\/archive\/mountain-weather\/184563$/)
    await expect(page.getByRole('heading', { level: 1, name: 'Mountain Weather' })).toBeVisible()
    await expect(page.getByText('This is an archived product.')).toBeVisible()
    await expect(page.getByRole('link', { name: 'all archived Mountain Weather' })).toHaveAttribute(
      'href',
      '/forecasts/avalanche/archive/mountain-weather',
    )
    await expect(page.getByRole('link', { name: 'current Mountain Weather' })).toHaveAttribute(
      'href',
      '/weather/forecast',
    )
    await expect(page.getByText(/Issued:\s*Monday, April 6, 2026 at 5:06 AM\s+MDT/)).toBeVisible()
    await expect(page.getByText(/Models do not predict any snowfall/)).toBeVisible()
    // The breadcrumb names the product by the day it was issued, not by its id.
    await expect(page.getByRole('navigation', { name: 'Breadcrumb' })).toContainText(
      'April 6, 2026',
    )
  })

  test('the forecast list offers the tab to a center with a NAC weather product', async ({
    page,
  }) => {
    await loadPage(page, `${ARCHIVE_URL}${SEASON}`)

    await expect(
      page.getByRole('navigation', { name: 'Archive views' }).getByRole('link', {
        name: 'Mountain Weather',
      }),
    ).toHaveAttribute('href', '/forecasts/avalanche/archive/mountain-weather?season=2026')
  })

  test('a center without a NAC weather product has no tab and no page', async ({ page }) => {
    // NWAC is seeded native for forecast and weather, but its `platforms.weather` is false.
    await loadPage(page, `${tenant('nwac')}/forecasts/avalanche/archive`)
    const tabs = page.getByRole('navigation', { name: 'Archive views' })
    await expect(tabs.getByRole('link', { name: 'Danger Over Time' })).toBeVisible()
    await expect(tabs.getByRole('link', { name: 'Mountain Weather' })).toHaveCount(0)

    const list = await page.goto(`${tenant('nwac')}/forecasts/avalanche/archive/mountain-weather`)
    expect(list?.status()).toBe(404)

    const product = await page.goto(
      `${tenant('nwac')}/forecasts/avalanche/archive/mountain-weather/184563`,
    )
    expect(product?.status()).toBe(404)
  })

  test('a center still on the widget gets the widget at the same addresses', async ({ page }) => {
    await loadPage(page, `${tenant('sac')}/forecasts/avalanche/archive/mountain-weather`)
    await expect(page).toHaveURL(/#\/archive\/weather$/)

    await loadPage(page, `${tenant('sac')}/forecasts/avalanche/archive/mountain-weather/184563`)
    await expect(page).toHaveURL(/#\/weather\/184563$/)
  })
})
