import { expect, test } from './fixture'
import { ZONE, loadPage, tenant, zoneSlug } from './helpers'

const SUMMARY_URL = `${tenant('snfac')}/forecasts/avalanche/${zoneSlug(ZONE.offSeasonSummary)}`

test.describe('Off-season degradation', () => {
  /**
   * Out of season a center publishes a `summary` product instead of a forecast: no danger ratings,
   * no avalanche problems, but still a bottom line and a discussion. The point of these assertions
   * is that the page loses the sections that have no data and keeps the ones that do — degrading to
   * a blank or a missing product is the failure mode that matters for a life-safety page.
   */
  test('renders general information instead of a forecast', async ({ page }) => {
    const errors = await loadPage(page, SUMMARY_URL)

    await expect(
      page.getByRole('heading', { level: 1, name: 'Galena Summit & Eastern Mtns' }),
    ).toBeVisible()
    await expect(page.locator('h1 + p')).toHaveText('General Avalanche Information')

    await expect(page.getByRole('heading', { name: 'Avalanche Danger' })).toHaveCount(0)
    await expect(page.getByText('0 - No Rating')).toHaveCount(0)
    await expect(page.getByRole('heading', { name: /^Avalanche Problems \(/ })).toHaveCount(0)

    await expect(page.getByRole('heading', { name: 'The Bottom Line' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Forecast Discussion' })).toBeVisible()
    await expect(page.getByRole('button', { name: /^Open media 1 of/ })).toBeVisible()

    expect(errors).toEqual([])
  })
})
