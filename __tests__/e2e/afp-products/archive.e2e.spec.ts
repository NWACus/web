import { expect, test } from './fixture'
import { ZONE, clickUntil, hasFixture, loadPage, tenant, zoneSlug } from './helpers'

const SLUG = zoneSlug(ZONE.forecast)
const FORECAST_URL = `${tenant('snfac')}/forecasts/avalanche/${SLUG}`

test.describe('Forecast archive', () => {
  test('the date picker offers the dates the archive actually holds', async ({ page }) => {
    await loadPage(page, FORECAST_URL)

    // The corpus archive holds two products for this zone, both in April 2026.
    await clickUntil(
      page.getByRole('button', { name: 'Current forecast' }),
      page.getByRole('link', { name: 'Sun Apr 05 2026' }),
    )
    await expect(page.getByRole('button', { name: 'Newer forecast' })).toBeDisabled()
  })

  test('a dated product is marked archived and links back to the current one', async ({ page }) => {
    const errors = await loadPage(page, `${FORECAST_URL}/2026-04-05`)

    // Inventory row X6, archived half.
    await expect(page.getByText('This is an archived product.')).toBeVisible()
    await expect(page.getByRole('link', { name: 'most recent forecast' })).toHaveAttribute(
      'href',
      `/forecasts/avalanche/${SLUG}`,
    )
    await expect(page.getByRole('heading', { name: 'The Bottom Line' })).toBeVisible()

    expect(errors).toEqual([])
  })

  test('the second archived date renders', async ({ page }) => {
    test.skip(
      !hasFixture('v2_public_product_by_id_summary_SNFAC.json'),
      'Blocked on products-api Case product_by_id_SNFAC_summary — the archive list advertises product 184562 but the corpus has no golden for it.',
    )

    await loadPage(page, `${FORECAST_URL}/2026-04-06`)
    await expect(page.getByText('This is an archived product.')).toBeVisible()
  })
})
