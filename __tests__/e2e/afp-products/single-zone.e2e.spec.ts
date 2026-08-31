import { expect, test } from './fixture'
import { ZONE, clickUntil, hasFixture, loadPage, tenant, zoneSlug } from './helpers'

const FORECAST_URL = `${tenant('snfac')}/forecasts/avalanche/${zoneSlug(ZONE.forecast)}`
const WARNING_URL = `${tenant('snfac')}/forecasts/avalanche/${zoneSlug(ZONE.warning)}`

test.describe('Native single-zone forecast', () => {
  test('renders the forecast product', async ({ page }) => {
    const errors = await loadPage(page, FORECAST_URL)

    await expect(
      page.getByRole('heading', { level: 1, name: 'Soldier & Wood River Valley Mtns' }),
    ).toBeVisible()
    // The subtitle string also occurs inside the forecaster's discussion prose, so it has to be
    // read off the header rather than matched anywhere on the page.
    await expect(page.locator('h1 + p')).toHaveText('Backcountry Avalanche Forecast')

    await expect(page.getByText('Author: Test Forecaster A')).toBeVisible()
    await expect(page.getByText(/Issued:\s*Sunday, April 5, 2026 at 6:19 AM\s+MDT/)).toBeVisible()
    await expect(page.getByText(/Expires:\s*Monday, April 6, 2026 at 4:00 AM\s+MDT/)).toBeVisible()

    await expect(page.getByRole('heading', { name: 'The Bottom Line' })).toBeVisible()
    await expect(page.getByText(/Refer to the Galena Summit & Eastern Mtns forecast/)).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Forecast Discussion' })).toBeVisible()

    // The widget is the other half of Control 1; seeing both would mean the flag leaked.
    await expect(page.locator('#widget-container')).toHaveCount(0)
    expect(errors).toEqual([])
  })

  test('renders the danger block with per-band ratings', async ({ page }) => {
    await loadPage(page, FORECAST_URL)

    await expect(page.getByRole('heading', { name: 'Avalanche Danger' })).toBeVisible()
    await expect(
      page.getByRole('heading', { level: 4, name: 'Sunday, April 5, 2026' }),
    ).toBeVisible()
    await expect(
      page.getByRole('heading', { level: 4, name: 'Monday, April 6, 2026' }),
    ).toBeVisible()

    // The band name carries a <br> between the label and the range, so match across it.
    await expect(page.getByText(/Middle Elevation\s*\(6500-8500'\)/).first()).toBeVisible()

    // Every danger value in the corpus is null, which the wire schema maps to "no rating" — three
    // bands across two days. A fixture with real ratings is an upstream capture we are waiting on.
    await expect(page.getByText('0 - No Rating')).toHaveCount(6)
    await expect(
      page.getByText(
        'Insufficient data for issuing of danger ratings, but a summary of avalanche conditions exists. Read the summary for more information.',
      ),
    ).toBeVisible()
  })

  test('marks an expired product without hiding it', async ({ page }) => {
    await loadPage(page, FORECAST_URL)

    // Inventory row X6. The golden expired on 2026-04-06, so this is stable in wall-clock terms.
    await expect(page.getByText('This product is expired.')).toBeVisible()
    await expect(page.getByRole('heading', { name: 'The Bottom Line' })).toBeVisible()
  })

  test('shows an active warning above the forecast', async ({ page }) => {
    const errors = await loadPage(page, WARNING_URL)

    // Filtered because Next's own route announcer is also role=alert.
    const alert = page.getByRole('alert').filter({ hasText: 'Avalanche Warning in Effect' })
    await expect(alert).toBeVisible()
    await expect(
      alert.getByRole('heading', { level: 2, name: 'Avalanche Warning in Effect' }),
    ).toBeVisible()

    await clickUntil(alert.getByText('Read more'), alert.getByText('Affected Area:'))

    expect(errors).toEqual([])
  })

  test('renders coloured danger ratings', async ({ page }) => {
    test.skip(
      !hasFixture('v2_public_product_forecast_SNFAC_problems.json'),
      'Blocked on products-api Case product_forecast_SNFAC_with_problems — no golden in the corpus carries a non-null danger array.',
    )

    await loadPage(page, FORECAST_URL)
    await expect(page.getByText('0 - No Rating')).toHaveCount(0)
  })

  test('renders avalanche problem cards, rose and sliders', async ({ page }) => {
    test.skip(
      !hasFixture('v2_public_product_forecast_SNFAC_problems.json'),
      'Blocked on products-api Case product_forecast_SNFAC_with_problems — no golden in the corpus has a populated forecast_avalanche_problems array.',
    )

    await loadPage(page, FORECAST_URL)
    await expect(page.getByRole('heading', { name: /^Avalanche Problems \(/ })).toBeVisible()
    await expect(page.getByRole('heading', { name: /^Problem #1:/ })).toBeVisible()
  })

  test('renders the inline mountain weather table', async ({ page }) => {
    test.skip(
      !hasFixture('v2_public_product_weather_table_SNFAC.json'),
      'Blocked on products-api Case product_weather_SNFAC_populated — the only weather golden has an empty weather_data and is not served at an id any forecast points at.',
    )

    await loadPage(page, FORECAST_URL)
    await expect(page.getByRole('heading', { name: 'Mountain Weather' })).toBeVisible()
  })
})
