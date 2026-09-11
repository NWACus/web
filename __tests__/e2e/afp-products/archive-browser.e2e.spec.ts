import { expect, test } from './fixture'
import { ZONE, clickUntil, loadPage, tenant, zoneSlug } from './helpers'

const ARCHIVE_URL = `${tenant('snfac')}/forecasts/avalanche/archive`

// The corpus archive holds April 2026 products only, which is season 2026 (2025-09-01 through
// 2026-08-31). The browser opens on the current season, so every spec names that season.
const SEASON = '?season=2026'

test.describe('Forecast archive browser', () => {
  test('lists the season with a danger tally, each row linking to its dated view', async ({
    page,
  }) => {
    const errors = await loadPage(page, `${ARCHIVE_URL}${SEASON}`)

    await expect(page.getByRole('heading', { name: 'Forecast Archive' })).toBeVisible()

    // Three single-zone forecasts and a summary across all four zones: seven rows.
    await expect(page.getByRole('heading', { name: '7 Products' })).toBeVisible()
    await expect(
      page.getByRole('list', { name: 'Archived products' }).getByRole('listitem'),
    ).toHaveCount(7)

    // Date · zone · danger, linking to the dated forecast for that zone-day (inventory row F3).
    await expect(
      page.getByRole('link', { name: /Apr 5, 2026.*Banner Summit.*Moderate \(2\)/ }),
    ).toHaveAttribute('href', '/forecasts/avalanche/banner-summit/2026-04-05')

    const tally = page.getByRole('list', { name: 'Products by danger rating' })
    await expect(tally.getByRole('listitem', { name: 'No Rating: 5' })).toBeVisible()
    await expect(tally.getByRole('listitem', { name: 'Moderate: 2' })).toBeVisible()

    expect(errors).toEqual([])
  })

  test('filters from the URL, and shows them as removable chips', async ({ page }) => {
    await loadPage(page, `${ARCHIVE_URL}${SEASON}&zone=banner-summit&danger=2`)

    await expect(page.getByRole('heading', { name: '1 Product' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Remove filter: Banner Summit' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Remove filter: Moderate' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Clear filters' })).toBeVisible()
  })

  test('a filter checkbox narrows the list and writes the URL', async ({ page }) => {
    await loadPage(page, `${ARCHIVE_URL}${SEASON}`)

    // The summary covers every zone, so the product-type filter alone leaves four rows.
    await clickUntil(
      page.getByRole('checkbox', { name: 'General Avalanche Information' }),
      page.getByRole('heading', { name: '4 Products' }),
    )
    await expect(page).toHaveURL(/type=summary/)
  })

  test('a row opens the dated forecast, which links back to the archive', async ({ page }) => {
    const slug = zoneSlug(ZONE.forecast)
    await loadPage(page, `${ARCHIVE_URL}${SEASON}&zone=${encodeURIComponent(slug)}`)

    await page.getByRole('link', { name: /Apr 5, 2026/ }).click()

    await expect(page).toHaveURL(new RegExp(`/forecasts/avalanche/[^/]+/2026-04-05$`))
    await expect(page.getByText('This is an archived product.')).toBeVisible()
    await expect(page.getByRole('link', { name: 'all archived forecasts' })).toHaveAttribute(
      'href',
      '/forecasts/avalanche/archive',
    )
  })

  test('an empty result says so rather than showing a blank list', async ({ page }) => {
    await loadPage(page, `${ARCHIVE_URL}${SEASON}&danger=5`)

    await expect(page.getByText('No products found')).toBeVisible()
    await expect(page.getByText('Try adjusting the filter criteria')).toBeVisible()
  })

  test('a center still on the widget gets the widget archive at the same address', async ({
    page,
  }) => {
    await loadPage(page, `${tenant('sac')}/forecasts/avalanche/archive`)

    // The legacy archive is a hash route inside the forecast widget.
    await expect(page).toHaveURL(/#\/archive\/forecast$/)
  })
})
