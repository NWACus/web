import { expect, test } from './fixture'
import { ZONE, loadPage, tenant, zoneSlug } from './helpers'

/**
 * Control 1 — the per-tenant × per-product rollout flag.
 *
 * Both states are read, never written: snfac is seeded native and sac is seeded on the widget, so
 * nothing here mutates state another parallel worker could observe. Flipping a flag mid-run would
 * also not reach an already-prerendered page.
 */

test.describe('Native vs widget rollout flag', () => {
  test('a native tenant renders the native zone page', async ({ page }) => {
    const errors = await loadPage(
      page,
      `${tenant('snfac')}/forecasts/avalanche/${zoneSlug(ZONE.forecast)}`,
    )

    await expect(page.locator('h1 + p')).toHaveText('Backcountry Avalanche Forecast')
    await expect(page.locator('#widget-container')).toHaveCount(0)
    expect(errors).toEqual([])
  })

  test('a widget tenant renders the embedded widget', async ({ page }) => {
    const errors = await loadPage(
      page,
      `${tenant('sac')}/forecasts/avalanche/central-sierra-nevada`,
    )

    // Only the mount point is asserted. The widget's own content comes from a third-party CDN that
    // the suite stubs, so anything it would draw is out of this repo's control.
    await expect(page.locator('#widget-container[data-widget="forecast"]')).toBeVisible()
    await expect(page.locator('#nac-widget-forecast')).toBeAttached()
    await expect(page.getByText('Backcountry Avalanche Forecast')).toHaveCount(0)
    expect(errors).toEqual([])
  })

  test('the flag applies to the all-zones route too', async ({ page }) => {
    await loadPage(page, `${tenant('snfac')}/forecasts/avalanche`)
    await expect(page.locator('[data-testid^="zone-card-"]')).toHaveCount(4)
    await expect(page.locator('#widget-container')).toHaveCount(0)

    await loadPage(page, `${tenant('sac')}/forecasts/avalanche`)
    await expect(page.locator('#widget-container[data-widget="forecast"]')).toBeVisible()
    await expect(page.locator('[data-testid^="zone-card-"]')).toHaveCount(0)
  })
})
