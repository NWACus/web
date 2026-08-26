import { expect, test } from './fixture'
import { loadPage, tenant } from './helpers'

/**
 * DVAC shares NWAC's upstream data — `dvac` is normalised to `nwac` at every NAC/AFP call site.
 *
 * The alias has a structural proof as well as a visible one: no DVAC-keyed handler exists in the
 * mock, so if the normalisation regressed the catch-all would answer 501, the call would be
 * recorded, and globalTeardown would fail the run. These assertions cannot pass by accident.
 */

test.describe('DVAC → NWAC alias', () => {
  test('renders NWAC zones on a DVAC page', async ({ page }) => {
    const errors = await loadPage(page, `${tenant('dvac')}/forecasts/avalanche`)

    // NWAC's own zone names, from the NWAC center metadata — not DVAC's and not Sawtooth's.
    await expect(page.getByRole('link', { name: 'Olympics' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Stevens Pass' })).toBeVisible()
    // Ten active zones; the three disabled ones must not appear.
    await expect(page.locator('[data-testid^="zone-card-"]')).toHaveCount(10)
    await expect(page.getByTestId('zone-card-mt-hood')).toBeVisible()

    expect(errors).toEqual([])
  })

  /**
   * The corpus has no NWAC product goldens, so every NWAC zone gets v2's real not-found answer.
   * That makes this the suite's check on the rule that matters most: a product we cannot load is
   * visible copy, never a blank page or a silently missing section.
   */
  test('a zone with no upstream product says so rather than rendering blank', async ({ page }) => {
    const errors = await loadPage(page, `${tenant('dvac')}/forecasts/avalanche/olympics`)

    await expect(
      page.getByText('Unable to load forecast data. Please try again later.'),
    ).toBeVisible()
    await expect(page.locator('header').first()).toBeVisible()
    await expect(page.locator('footer').first()).toBeVisible()

    expect(errors).toEqual([])
  })

  test('the same zone renders the widget for NWAC, which is not rolled out', async ({ page }) => {
    await loadPage(page, `${tenant('nwac')}/forecasts/avalanche/olympics`)

    // Same upstream center, different rollout state — Control 1 is per tenant, not per center.
    await expect(page.locator('#widget-container[data-widget="forecast"]')).toBeVisible()
  })
})
