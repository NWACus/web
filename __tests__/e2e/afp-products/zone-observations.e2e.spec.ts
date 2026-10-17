import { expect, test } from './fixture'
import { ZONE, loadPage, tenant, zoneSlug } from './helpers'

/**
 * Forecast-9: the zone's Observations and Avalanches tabs on the live forecast page.
 *
 * SNFAC's metadata fixture has `obs_tab` on. The obs API serves one recorded center-week
 * (`mocks/obs/graphql-week.json`: 30 observations and 56 avalanches), and the app keeps the ones
 * inside the zone's map-layer outline: 13 and 17 for Galena Summit, the counts the live widget
 * shows for that week. Galena's fixture is a summary, so the first tab reads "Avalanche
 * Information".
 */
const GALENA = `${tenant('snfac')}/forecasts/avalanche/${zoneSlug(ZONE.offSeasonSummary)}`
const SOLDIER = `${tenant('snfac')}/forecasts/avalanche/${zoneSlug(ZONE.forecast)}`

test.describe('Zone Observations and Avalanches tabs', () => {
  test('are in the prerendered HTML, around the forecast', async ({ page }) => {
    // The HTML a reader is served, before any script runs: reading the tab through
    // `useSearchParams` would take the bar and the forecast out of it.
    const html = await (await page.request.get(GALENA)).text()

    expect(html).toContain('role="tablist"')
    expect(html).toContain('Avalanche Information')
    expect(html).toContain('The Bottom Line')
  })

  test('show the zone’s observations, linked to their pages', async ({ page }) => {
    const errors = await loadPage(page, GALENA)
    const tabs = page.getByRole('tablist')

    await expect(tabs.getByRole('tab', { name: 'Avalanche Information' })).toHaveAttribute(
      'aria-selected',
      'true',
    )
    await tabs.getByRole('tab', { name: 'Observations' }).click()

    await expect(page).toHaveURL(/\?tab=observations$/)
    const pane = page.locator('#zone-tab-records')
    await expect(pane.getByRole('heading', { name: 'Recent Observations' })).toBeVisible()
    await expect(
      pane.locator('a[href^="/observations/"]').filter({ hasText: ', 2026' }),
    ).toHaveCount(13)

    // Newest first, with the widget's date, sign and media count.
    const first = pane.locator('a[href^="/observations/"]').first()
    await expect(first).toHaveAttribute(
      'href',
      '/observations/5f0d40b1-1dd0-45d5-b85c-cc99683b9e30',
    )
    await expect(first).toContainText('Mar 2, 2026')
    await expect(first).toContainText('Butterfield')
    await expect(first).toContainText('Collapsing/Cracking')

    // A record from the center's week outside the zone's outline is not shown.
    await expect(pane.getByText('Williams', { exact: true })).toHaveCount(0)
    // The forecast is hidden, not gone.
    await expect(page.getByRole('heading', { name: 'The Bottom Line' })).toBeVisible()
    expect(errors).toEqual([])
  })

  test('show the zone’s avalanches with size and trigger', async ({ page }) => {
    await loadPage(page, `${GALENA}?tab=avalanches`)

    const pane = page.locator('#zone-tab-records')
    await expect(pane.getByRole('heading', { name: 'Recent Avalanches' })).toBeVisible()
    await expect(pane.locator('a[href^="/observations/avalanches/"]')).toHaveCount(17)

    const first = pane.locator('a[href^="/observations/avalanches/"]').first()
    await expect(first).toContainText('Feb 26, 2026')
    await expect(first).toContainText('Osberg Ridge')
    await expect(first).toContainText('Human')
    await expect(first).toContainText('D1')
  })

  test('keep the tab in the address, with Back and an unknown tab', async ({ page }) => {
    await loadPage(page, SOLDIER)
    const tabs = page.getByRole('tablist')

    await tabs.getByRole('tab', { name: 'Avalanches' }).click()
    await expect(page).toHaveURL(/\?tab=avalanches$/)

    await page.goBack()
    await expect(tabs.getByRole('tab', { name: 'Avalanche Forecast' })).toHaveAttribute(
      'aria-selected',
      'true',
    )
    await expect(page.getByRole('heading', { name: 'Recent Avalanches' })).toHaveCount(0)

    // As the widget redirects an unknown tab, the address drops it and the forecast shows.
    await loadPage(page, `${SOLDIER}?tab=weather`)
    await expect(page).toHaveURL(SOLDIER)
    await expect(tabs.getByRole('tab', { name: 'Avalanche Forecast' })).toHaveAttribute(
      'aria-selected',
      'true',
    )
  })

  test('aren’t on a dated page', async ({ page }) => {
    await loadPage(page, `${SOLDIER}/2026-04-05`)

    await expect(page.getByRole('heading', { name: 'The Bottom Line' })).toBeVisible()
    await expect(page.getByRole('tablist')).toHaveCount(0)
  })

  test('print the forecast, not the tabs, from any tab', async ({ page }) => {
    await loadPage(page, `${SOLDIER}?tab=observations`)
    await expect(page.getByRole('heading', { name: 'Recent Observations' })).toBeVisible()

    await page.emulateMedia({ media: 'print' })

    await expect(page.getByRole('heading', { name: 'Forecast Discussion' })).toBeVisible()
    await expect(page.getByRole('tablist')).toBeHidden()
    await expect(page.getByRole('heading', { name: 'Recent Observations' })).toBeHidden()
  })

  test.describe('on a phone', () => {
    test.use({ viewport: { width: 375, height: 812 } })

    test('scroll the selected tab into view', async ({ page }) => {
      await loadPage(page, `${GALENA}?tab=avalanches`)

      const tab = page.getByRole('tab', { name: 'Avalanches' })
      await expect(tab).toHaveAttribute('aria-selected', 'true')
      // The bar overflows at this width; the selected tab sits wholly inside its visible width.
      const bar = await page.getByRole('tablist').boundingBox()
      const box = await tab.boundingBox()
      expect(bar && box).toBeTruthy()
      if (bar && box) {
        expect(box.x).toBeGreaterThanOrEqual(bar.x)
        expect(box.x + box.width).toBeLessThanOrEqual(bar.x + bar.width + 1)
      }
      // The bar scrolls rather than wrapping its labels.
      await expect(page.getByRole('tab', { name: 'Avalanche Information' })).toHaveCSS(
        'white-space',
        'nowrap',
      )
    })
  })
})
