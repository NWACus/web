import { expect, test } from './fixture'
import { loadPage, tenant } from './helpers'

const WEATHER_PATH = '/weather/forecast'
/** The one day the mock has a forecast for; see `nwacWeatherDay` in mocks/handlers.mjs. */
const DATED_PATH = `${WEATHER_PATH}/2026-09-14`

/**
 * NWAC's own Mountain Weather Forecast, read from products-api v3 rather than the AFP weather
 * product. The recorded day has a morning and an afternoon issuance.
 */
test.describe('NWAC Mountain Weather Forecast', () => {
  test('renders a date’s forecast with the latest issuance shown first', async ({ page }) => {
    const errors = await loadPage(page, `${tenant('nwac')}${DATED_PATH}`)

    await expect(page.getByRole('heading', { level: 1, name: 'Mountain Weather' })).toBeVisible()
    await expect(page.getByRole('navigation', { name: 'Breadcrumb' })).toContainText('Sep 14, 2026')

    const afternoon = page.getByText('Monday, September 14, 2026 - 3:00PM', { exact: true })
    const morning = page.getByText('Monday, September 14, 2026 - 7:00AM', { exact: true })
    await expect(afternoon).toBeVisible()
    await expect(morning).toBeHidden()
    await expect(page.getByRole('heading', { name: 'Weather Synopsis' }).first()).toBeVisible()

    await page.getByRole('radio', { name: /Morning/ }).click()
    await expect(morning).toBeVisible()
    await expect(afternoon).toBeHidden()

    // This page is NWAC's own; the widget never renders here.
    await expect(page.locator('#widget-container')).toHaveCount(0)
    expect(errors).toEqual([])
  })

  test('today’s page says when nothing is published, and asks its freshness address', async ({
    page,
  }) => {
    // The default fixture aborts the check, so this observes the question, not an answer.
    const asked = page.waitForRequest(/\/api\/nwac\/nwac-weather-freshness\/[a-f0-9]{40}$/)

    const errors = await loadPage(page, `${tenant('nwac')}${WEATHER_PATH}`)

    await expect(page.getByText(/No Mountain Weather forecast published for/)).toBeVisible()
    await asked
    expect(errors).toEqual([])
  })

  test('another center has no dated page', async ({ page }) => {
    const response = await page.goto(`${tenant('snfac')}${DATED_PATH}`)

    expect(response?.status()).toBe(404)
  })
})
