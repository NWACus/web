import { expect, test } from './fixture'
import {
  ZONE,
  clickUntil,
  hasFixture,
  loadPage,
  requestTenantPath,
  tenant,
  zoneSlug,
} from './helpers'

const SLUG = zoneSlug(ZONE.forecast)
const FORECAST_URL = `${tenant('snfac')}/forecasts/avalanche/${SLUG}`

test.describe('Forecast archive', () => {
  test('the date picker offers the dates the archive actually holds', async ({ page }) => {
    await loadPage(page, FORECAST_URL)

    // The corpus archive holds two products for this zone, both in April 2026. The button reads
    // the live product's valid date, as the widget's does.
    await clickUntil(
      page.getByRole('button', { name: 'Apr 5, 2026' }),
      page.getByRole('link', { name: 'Sun Apr 05 2026' }),
    )
    await expect(page.getByRole('button', { name: 'Newer forecast' })).toBeDisabled()
  })

  test('the live product’s own date opens the live page', async ({ page }) => {
    const errors = await loadPage(page, `${FORECAST_URL}/2026-04-05`)

    // 2026-04-05 is this zone's live product, so the dated address hands over to the live one.
    // Compared decoded: the slug's `&` may come back percent-encoded.
    await expect(page).toHaveURL(
      (url) => decodeURIComponent(url.pathname) === `/forecasts/avalanche/${SLUG}`,
    )
    await expect(page.getByText('This is an archived product.')).toBeHidden()

    expect(errors).toEqual([])
  })

  test('a dated product is marked archived and links back to the current one', async ({ page }) => {
    // The corpus's one by-id golden is this zone's live product, whose dated page would hand over
    // to the live one (above); hold that check off to see the dated page itself.
    await page.route('**/forecast-current-date/**', (route) => route.abort('failed'))
    const errors = await loadPage(page, `${FORECAST_URL}/2026-04-05`)

    // Inventory row X6, archived half.
    const notice = page.getByText('This is an archived product.')
    await expect(notice).toBeVisible()
    // The widget's order (Forecast-2): the notice sits above the title, not under it.
    const noticeBox = await notice.boundingBox()
    const titleBox = await page.getByRole('heading', { level: 1 }).boundingBox()
    if (!noticeBox || !titleBox) throw new Error('notice or title has no box')
    expect(noticeBox.y).toBeLessThan(titleBox.y)
    await expect(page.getByRole('link', { name: 'most recent forecast' })).toHaveAttribute(
      'href',
      `/forecasts/avalanche/${SLUG}`,
    )
    await expect(page.getByRole('heading', { name: 'The Bottom Line' })).toBeVisible()

    expect(errors).toEqual([])
  })

  test('a day inside a summary’s validity redirects to that summary’s dated address', async () => {
    // The 2026-04-06 summary expires 2026-04-10 18:00Z, so it covers the 7th–10th, which have no
    // product of their own. Its by-id golden is missing, so only the server's answer is checked;
    // following it would ask upstream for that product.
    const res = await requestTenantPath('snfac', `/forecasts/avalanche/${SLUG}/2026-04-08`)

    expect(res.status).toBe(307)
    expect(decodeURIComponent(res.location ?? '')).toBe(`/forecasts/avalanche/${SLUG}/2026-04-06`)
  })

  test('a day no product covers is still a 404', async ({ page }) => {
    // The summary expired at 18:00Z on the 10th, before the 11th began in Boise.
    const response = await page.goto(`${FORECAST_URL}/2026-04-11`)

    expect(response?.status()).toBe(404)
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
