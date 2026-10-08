import { expect, test } from './fixture'
import { hasFixture, loadPage, tenant } from './helpers'

const WEATHER_PATH = '/weather/forecast'

/**
 * The standalone Mountain Weather page — inventory rows F4, F19, F22 and F26 — for centers that
 * publish a traditional NAC weather product. The golden is SNFAC's real current product: a
 * discussion, but an empty `weather_data`, so the tables are covered by a spec that turns itself on
 * when the populated capture lands.
 */
const NWAC_ONLY =
  'Native NAC weather is limited to NWAC for now; see src/utilities/nativeProductCenters.ts.'

test.describe('Native mountain weather page', () => {
  test('renders the current weather product natively', async ({ page }) => {
    test.skip(true, NWAC_ONLY)
    const errors = await loadPage(page, `${tenant('snfac')}${WEATHER_PATH}`)

    await expect(page.getByRole('heading', { level: 1, name: 'Mountain Weather' })).toBeVisible()
    await expect(page.locator('h1 + p')).toHaveText('All Zones')

    // The product's own metadata, not a forecast's: issued and author, and no expiry.
    await expect(page.getByText('Test Forecaster A', { exact: true })).toBeVisible()
    await expect(page.getByText('Monday, April 6, 2026 - 5:06AM', { exact: true })).toBeVisible()
    await expect(page.getByText('Expires', { exact: true })).toHaveCount(0)

    await expect(page.getByText(/Models do not predict any snowfall/)).toBeVisible()
    await expect(page.getByText(/provided by the U\.S\.D\.A\. Forest Service/)).toBeVisible()

    // The widget is the other half of Control 1; seeing both would mean the flag leaked.
    await expect(page.locator('#widget-container')).toHaveCount(0)
    expect(errors).toEqual([])
  })

  test('renders one weather table per zone, in zone order', async ({ page }) => {
    test.skip(true, NWAC_ONLY)
    test.skip(
      !hasFixture('v2_public_product_weather_table_SNFAC.json'),
      'Blocked on products-api Case product_weather_SNFAC_populated — the only weather golden has an empty weather_data.',
    )

    await loadPage(page, `${tenant('snfac')}${WEATHER_PATH}`)

    const titles = page.getByRole('columnheader').filter({ hasText: /Mtns|Summit/ })
    await expect(titles).toHaveText([
      'Galena Summit & Eastern Mtns',
      'Soldier & Wood River Valley Mtns',
      'Sawtooth & Western Smoky Mtns',
      'Banner Summit',
    ])
  })

  test('a center other than NWAC gets the widget even with its weather flag on', async ({
    page,
  }) => {
    // SNFAC is seeded with `weather` on.
    const errors = await loadPage(page, `${tenant('snfac')}${WEATHER_PATH}`)

    await expect(page.locator('#widget-container[data-widget="forecast"]')).toBeVisible()
    await expect(page.getByText('All Zones')).toHaveCount(0)
    expect(errors).toEqual([])
  })

  test('a widget tenant still renders the embedded widget', async ({ page }) => {
    const errors = await loadPage(page, `${tenant('sac')}${WEATHER_PATH}`)

    await expect(page.getByRole('heading', { level: 1, name: 'Mountain Weather' })).toBeVisible()
    await expect(page.locator('#widget-container[data-widget="forecast"]')).toBeVisible()
    await expect(page.getByText('All Zones')).toHaveCount(0)
    expect(errors).toEqual([])
  })

  test('a center without a NAC weather product has no page', async ({ page }) => {
    // DVAC reads NWAC's capabilities, and NWAC's `platforms.weather` is false upstream because it
    // authors mountain weather in-house. NWAC itself renders that forecast here instead: see
    // nwac-weather.e2e.spec.ts.
    const response = await page.goto(`${tenant('dvac')}${WEATHER_PATH}`)

    expect(response?.status()).toBe(404)
  })
})
