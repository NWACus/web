import { expect, test } from './fixture'
import { ZONE, loadPage, tenant, zoneSlug } from './helpers'

const GRID_URL = `${tenant('snfac')}/forecasts/avalanche`

test.describe('All-zones grid', () => {
  test('renders one card per active zone', async ({ page }) => {
    const errors = await loadPage(page, GRID_URL)

    // Four active zones in the center metadata; the fifth is disabled and must not appear.
    await expect(page.locator('[data-testid^="zone-card-"]')).toHaveCount(4)
    await expect(page.getByTestId('zone-card-banner-summit')).toBeVisible()

    const forecastCard = page.getByTestId(`zone-card-${zoneSlug(ZONE.forecast)}`)
    await expect(forecastCard.getByRole('heading', { name: 'The Bottom Line' })).toBeVisible()

    expect(errors).toEqual([])
  })

  // Forecast-144
  test("a forecast card shows today's danger section, with travel advice in the outlook's place", async ({
    page,
  }) => {
    await loadPage(page, GRID_URL)

    // The golden carries an outlook for Monday; the card leaves it out.
    const forecastCard = page.getByTestId(`zone-card-${zoneSlug(ZONE.forecast)}`)
    await expect(forecastCard.getByRole('heading', { name: 'Sunday, April 5, 2026' })).toBeVisible()
    await expect(forecastCard.getByRole('heading', { name: 'Monday, April 6, 2026' })).toHaveCount(
      0,
    )
    await expect(forecastCard.getByRole('list', { name: 'Travel advice' })).toBeVisible()
    await expect(forecastCard.getByRole('button', { name: 'About Avalanche Danger' })).toBeVisible()
    await expect(forecastCard.getByText('Avalanche Danger Scale')).toBeVisible()
    // Kept from before the change: the card's own expired notice (Forecast-46).
    await expect(forecastCard.getByText('This product is expired.')).toBeVisible()
  })

  // Forecast-145, Forecast-140
  test('heads the page by product type and ends it with the scope disclaimer', async ({ page }) => {
    await loadPage(page, GRID_URL)

    // One zone carries a summary and the rest forecasts, so any forecast decides the heading.
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(
      'Backcountry Avalanche Forecast',
    )
    await expect(
      page.getByText(
        'This information is provided by the U.S.D.A. Forest Service and describes general backcountry avalanche hazard and conditions.',
      ),
    ).toBeVisible()
  })

  test('a summary zone shows no danger block and a warning zone shows its alert', async ({
    page,
  }) => {
    await loadPage(page, GRID_URL)

    const summaryCard = page.getByTestId(`zone-card-${zoneSlug(ZONE.offSeasonSummary)}`)
    await expect(summaryCard.getByRole('heading', { name: 'Avalanche Danger' })).toHaveCount(0)
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

    await page.getByRole('link', { name: 'Banner Summit', exact: true }).click()

    await expect(page).toHaveURL(/\/forecasts\/avalanche\/banner-summit$/)
    await expect(page.getByRole('heading', { level: 1, name: 'Banner Summit' })).toBeVisible()
  })

  test('only the zone name and the button link to the zone page', async ({ page }) => {
    await loadPage(page, GRID_URL)

    const card = page.getByTestId(`zone-card-${zoneSlug(ZONE.forecast)}`)
    await expect(card.locator('a[href^="/forecasts/avalanche/"]')).toHaveCount(2)

    // The bottom line is read in place, so a link inside it can be followed on its own.
    const bottomLine = card.getByRole('heading', { name: 'The Bottom Line' })
    const box = await bottomLine.boundingBox()
    if (!box) throw new Error('bottom line has no box')
    const linkOnTop = await page.evaluate(
      ([x, y]) => document.elementFromPoint(x, y)?.closest('a') != null,
      [box.x + box.width / 2, box.y + box.height / 2],
    )
    expect(linkOnTop).toBe(false)

    await card.getByRole('link', { name: /^(Full Forecast|More Information): / }).click()
    await expect(page.locator('[data-testid^="zone-card-"]')).toHaveCount(0)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  })

  /**
   * Three of Sawtooth's four zone names contain an `&`, which Next percent-encodes in the route
   * param. Following the link the grid itself renders is the cheapest regression test for that.
   */
  test('a zone card whose name contains an ampersand links to a page that resolves', async ({
    page,
  }) => {
    await loadPage(page, GRID_URL)

    await page.getByRole('link', { name: 'Soldier & Wood River Valley Mtns', exact: true }).click()

    await expect(
      page.getByRole('heading', { level: 1, name: 'Soldier & Wood River Valley Mtns' }),
    ).toBeVisible()
    await expect(page.getByText('Zone not found.')).toHaveCount(0)
  })
})
