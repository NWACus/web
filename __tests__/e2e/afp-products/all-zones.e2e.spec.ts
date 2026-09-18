import { expect, test } from './fixture'
import { ZONE, loadPage, tenant, zoneSlug } from './helpers'

const GRID_URL = `${tenant('snfac')}/forecasts/avalanche`

test.describe('All-zones grid', () => {
  test('renders one card per active zone', async ({ page }) => {
    const errors = await loadPage(page, GRID_URL)

    // Four active zones in the center metadata; the fifth is disabled and must not appear.
    await expect(page.locator('[data-testid^="zone-card-"]')).toHaveCount(4)
    await expect(page.getByTestId('zone-card-banner-summit')).toBeVisible()

    // The compact card heads its columns "Today"/"Tomorrow" rather than the product's valid dates,
    // which is what distinguishes it from the single-zone layout.
    const forecastCard = page.getByTestId(`zone-card-${zoneSlug(ZONE.forecast)}`)
    await expect(forecastCard.getByRole('heading', { name: 'Today' })).toBeVisible()
    await expect(forecastCard.getByRole('heading', { name: 'Tomorrow' })).toBeVisible()
    await expect(forecastCard.getByRole('heading', { name: 'The Bottom Line' })).toBeVisible()

    expect(errors).toEqual([])
  })

  test('a summary zone shows no danger block and a warning zone shows its alert', async ({
    page,
  }) => {
    await loadPage(page, GRID_URL)

    const summaryCard = page.getByTestId(`zone-card-${zoneSlug(ZONE.offSeasonSummary)}`)
    await expect(summaryCard.getByRole('heading', { name: 'Today' })).toHaveCount(0)
    await expect(summaryCard.getByRole('heading', { name: 'The Bottom Line' })).toBeVisible()

    await expect(
      page.getByTestId(`zone-card-${zoneSlug(ZONE.warning)}`).getByRole('alert'),
    ).toBeVisible()
  })

  test('marks an expired product on the card, not only on the zone page', async ({ page }) => {
    await loadPage(page, GRID_URL)

    // Expiry is the one state the revalidate-on-view check cannot catch: a product can lapse with
    // no replacement published, which is no change at all. Every card here carries a live danger
    // rating, so it needs the same signal the zone page has. Same golden the single-zone spec uses
    // — it expired on 2026-04-06, so this is stable in wall-clock terms.
    await expect(
      page
        .getByTestId(`zone-card-${zoneSlug(ZONE.forecast)}`)
        .getByText('This product is expired.'),
    ).toBeVisible()
  })

  test('a zone card links to its zone page', async ({ page }) => {
    await loadPage(page, GRID_URL)

    await page.getByRole('link', { name: 'Banner Summit' }).click()

    await expect(page).toHaveURL(/\/forecasts\/avalanche\/banner-summit$/)
    await expect(page.getByRole('heading', { level: 1, name: 'Banner Summit' })).toBeVisible()
  })

  /**
   * Three of Sawtooth's four zone names contain an `&`, which Next percent-encodes in the route
   * param. Following the link the grid itself renders is the cheapest regression test for that.
   */
  test('a zone card whose name contains an ampersand links to a page that resolves', async ({
    page,
  }) => {
    await loadPage(page, GRID_URL)

    await page.getByRole('link', { name: 'Soldier & Wood River Valley Mtns' }).click()

    await expect(
      page.getByRole('heading', { level: 1, name: 'Soldier & Wood River Valley Mtns' }),
    ).toBeVisible()
    await expect(page.getByText('Zone not found.')).toHaveCount(0)
  })
})
