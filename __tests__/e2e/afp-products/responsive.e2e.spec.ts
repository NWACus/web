import { expect, test } from './fixture'
import { ZONE, loadPage, tenant, zoneSlug } from './helpers'

const FORECAST_URL = `${tenant('snfac')}/forecasts/avalanche/${zoneSlug(ZONE.forecast)}`

const PHONE = { width: 375, height: 812 }
const DESKTOP = { width: 1280, height: 800 }

/**
 * Inventory row X8 — works at phone width.
 *
 * Both assertions here would genuinely fail on a layout regression: one reads a class-driven
 * content swap, the other measures real reflow. "Is the page visible at 375px" would not.
 */
test.describe('Phone width', () => {
  test('the danger scale abbreviates its rating labels', async ({ page }) => {
    await page.setViewportSize(PHONE)
    await loadPage(page, FORECAST_URL)

    await expect(page.getByText('Cons', { exact: true })).toBeVisible()
    await expect(page.getByText('Considerable', { exact: true })).toBeHidden()

    await page.setViewportSize(DESKTOP)

    await expect(page.getByText('Considerable', { exact: true })).toBeVisible()
    await expect(page.getByText('Cons', { exact: true })).toBeHidden()
  })

  test('media thumbnails reflow from five columns to three', async ({ page }) => {
    await page.setViewportSize(DESKTOP)
    await loadPage(page, FORECAST_URL)

    const first = page.getByRole('button', { name: 'Open media 1 of 4' })
    const fourth = page.getByRole('button', { name: 'Open media 4 of 4' })

    // Five columns: all four thumbnails share a row.
    expect((await first.boundingBox())?.y).toBe((await fourth.boundingBox())?.y)

    await page.setViewportSize(PHONE)

    // Three columns: the fourth wraps.
    expect((await first.boundingBox())?.y).not.toBe((await fourth.boundingBox())?.y)
  })
})
