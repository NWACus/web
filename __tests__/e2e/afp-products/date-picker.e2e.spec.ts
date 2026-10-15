import { expect, test } from './fixture'
import { ZONE, clickUntil, loadPage, tenant, zoneSlug } from './helpers'

// The live product for this zone is the 2026-04-05 forecast; the corpus archive also lists the
// 2026-04-06 summary for it. Both are rated -1 (no rating).
const FORECAST_URL = `${tenant('snfac')}/forecasts/avalanche/${zoneSlug(ZONE.forecast)}`
// This zone's live product is a May summary; its April 5 forecast is rated Moderate.
const WARNING_ZONE_URL = `${tenant('snfac')}/forecasts/avalanche/${zoneSlug(ZONE.warning)}`

test.describe('Forecast date picker', () => {
  test('names the zone and answers an empty day with a brief notice', async ({ page }) => {
    const errors = await loadPage(page, FORECAST_URL)

    const trigger = page.getByRole('button', { name: 'Apr 5, 2026' })
    await expect(trigger).toHaveAttribute('title', 'Choose a date')
    await clickUntil(trigger, page.getByRole('link', { name: 'Sun Apr 05 2026' }))

    // SNFAC has four active zones, so the dropdown names this one, as the widget's does.
    await expect(
      page.getByRole('dialog').getByText('Soldier & Wood River Valley Mtns'),
    ).toBeVisible()

    await page.getByRole('button', { name: 'Wed Apr 01 2026' }).click()
    const notice = page.getByText('Nothing found for the selected date and forecast zone')
    await expect(notice).toBeVisible()
    await expect(notice).toBeHidden({ timeout: 3000 })

    expect(errors).toEqual([])
  })

  test('previews a day’s danger on hover and on keyboard focus', async ({ page }) => {
    await loadPage(page, WARNING_ZONE_URL)

    await clickUntil(
      page.getByRole('button', { name: 'May 4, 2026' }),
      page.getByRole('button', { name: /previous month/i }),
    )
    await page.getByRole('button', { name: /previous month/i }).click()

    const day = page.getByRole('link', { name: 'Sun Apr 05 2026' })
    const preview = page.getByRole('tooltip').filter({ hasText: 'moderate' })

    await day.hover()
    await expect(preview).toBeVisible()
    await expect(preview.locator('svg')).toBeVisible()

    // Off the day, then back by keyboard focus alone.
    await page.mouse.move(0, 0)
    await expect(preview).toBeHidden()
    await day.focus()
    await expect(preview).toBeVisible()

    // A day rated -1 has no triangle to draw.
    await page.getByRole('link', { name: 'Mon Apr 06 2026' }).hover()
    await expect(
      page.getByRole('tooltip').filter({ hasText: 'No Danger Rating' }).first(),
    ).toBeVisible()
  })

  test('the older arrow looks past the loaded months, and says when there is nothing', async ({
    page,
  }) => {
    const errors = await loadPage(page, FORECAST_URL)

    // Nothing older is loaded, but months remain back to the calendar start, so the arrow asks.
    const older = page.getByRole('button', { name: 'Older forecast' })
    await expect(older).toBeEnabled()

    const lookup = page.waitForResponse((res) => res.url().includes('/forecast-archive/adjacent'))
    await older.click()
    expect((await lookup).status()).toBe(200)

    // The corpus has no product before 2026-04-05 for this zone.
    await expect(page.getByText('No older forecast for this zone.')).toBeVisible()
    await expect(older).toBeDisabled()

    expect(errors).toEqual([])
  })
})
