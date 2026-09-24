import type { Page } from '@playwright/test'

import { expect, test } from './fixture'
import { clickUntil, loadPage, tenant } from './helpers'

/**
 * Inventory rows O1, O2, O4, O6, O11, O12 — the native observation viewer, and its rollout flag.
 *
 * nwac is seeded native for observations and sac stays on the widget; both states are read, never
 * written. The obs API is mocked from scrubbed live captures (`mocks/obs/`): every list request
 * gets the same page, so these assert what the viewer renders from it, not the filtering, which
 * has its own property test (O10). The map is a canvas with a stubbed empty style; what a browser
 * can assert on is everything around it.
 */

const PHONE = { width: 375, height: 812 }
const OBSERVATION = 'd3578079-af36-41b2-b796-01a445da25ee'
const AVALANCHE = '3352d330-879c-474e-9c5f-83ec4e3193d4'
const MISSING = '00000000-0000-4000-8000-000000000000'

const EMPTY_STYLE = JSON.stringify({ version: 8, sources: {}, layers: [] })
const NO_ZONES = JSON.stringify({ type: 'FeatureCollection', features: [] })

/**
 * Mapbox's style and telemetry, and the zone outlines, off the network. The outlines come from
 * the danger map's endpoint, whose all-centers layer the mocks don't carry; the viewer draws none
 * without it, but the endpoint's 502 would read as a failure to `loadPage`.
 */
async function stubMap(page: Page) {
  await page.route('**/api.mapbox.com/**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: route.request().url().includes('/styles/v1/') ? EMPTY_STYLE : '{}',
    }),
  )
  await page.route('**/events.mapbox.com/**', (route) => route.fulfill({ status: 204, body: '' }))
  await page.route('**/api/*/danger-map**', (route) =>
    route.fulfill({ contentType: 'application/json', body: NO_ZONES }),
  )
}

test.describe('Native vs widget observations', () => {
  test('a widget tenant keeps the observations widget on every route', async ({ page }) => {
    for (const path of [
      '/observations',
      '/observations/avalanches',
      `/observations/${OBSERVATION}`,
    ]) {
      const errors = await loadPage(page, `${tenant('sac')}${path}`)
      await expect(page.locator('#widget-container[data-widget="observations"]')).toBeVisible()
      await expect(page.getByTestId('observation-viewer')).toHaveCount(0)
      expect(errors).toEqual([])
    }
  })

  test('a native tenant lists observations in the map area', async ({ page }) => {
    await stubMap(page)
    const errors = await loadPage(page, `${tenant('nwac')}/observations`)

    await expect(page.locator('#widget-container')).toHaveCount(0)
    await expect(page.getByTestId('observation-map')).toBeVisible()
    await expect(page.getByText('143 observations within map area')).toBeVisible()
    await expect(page.getByTestId('observation-card')).toHaveCount(10)
    await expect(page.getByTestId('observation-card').first()).toContainText('Kendall Lakes')
    await expect(page.getByTestId('observation-card').first()).toContainText('Snoqualmie Pass')
    expect(errors).toEqual([])
  })

  test('the avalanches tab switches in place and counts avalanches', async ({ page }) => {
    await stubMap(page)
    await loadPage(page, `${tenant('nwac')}/observations`)
    await expect(page.getByTestId('observation-card').first()).toBeVisible()

    await page.getByRole('link', { name: 'Avalanches', exact: true }).click()
    await expect(page).toHaveURL(/\/observations\/avalanches$/)
    // A report of twelve avalanches counts twelve: the headline is the API's sum, not its rows.
    await expect(page.getByText('87 avalanches within map area')).toBeVisible()
    await expect(page.getByTestId('avalanche-card').first()).toContainText(
      'Chutla & Wahpenayo Peaks',
    )
    await expect(page.getByTestId('avalanche-card').first()).toContainText('D2.5')
  })

  test('a record opens over the list, and back closes it', async ({ page }) => {
    await stubMap(page)
    await loadPage(page, `${tenant('nwac')}/observations`)
    const card = page.getByTestId('observation-card').filter({ hasText: 'Lanham Lake' })

    await clickUntil(card, page.getByRole('dialog'))
    await expect(page).toHaveURL(new RegExp(`/observations/${OBSERVATION}$`))
    const detail = page.getByRole('dialog').getByTestId('observation-detail')
    await expect(detail.getByRole('heading', { name: 'Field Observation', level: 2 })).toBeVisible()
    await expect(detail.getByRole('heading', { name: 'Problems' })).toBeVisible()
    await expect(detail.getByRole('heading', { name: 'Wind Slab' })).toBeVisible()

    await page.goBack()
    await expect(page.getByRole('dialog')).toHaveCount(0)
    await expect(page).toHaveURL(/\/observations$/)
    await expect(page.getByTestId('observation-card').first()).toBeVisible()
  })

  test('closing after back from a nested record returns to the list, not off the viewer', async ({
    page,
  }) => {
    await stubMap(page)
    await loadPage(page, `${tenant('nwac')}/observations`)
    const card = page.getByTestId('observation-card').filter({ hasText: 'Lanham Lake' })
    await clickUntil(card, page.getByRole('dialog'))

    // One of its avalanches, opened over it; back returns to the observation, still in the modal.
    await page.getByRole('dialog').getByTestId('avalanche-card').first().click()
    await expect(page).toHaveURL(/\/observations\/avalanches\/[0-9a-f-]{36}$/)
    await page.goBack()
    await expect(page).toHaveURL(new RegExp(`/observations/${OBSERVATION}$`))

    await page.getByRole('dialog').getByRole('button', { name: 'Close' }).click()
    await expect(page.getByRole('dialog')).toHaveCount(0)
    await expect(page).toHaveURL(/\/observations$/)
    await expect(page.getByTestId('observation-card').first()).toBeVisible()
  })

  test('a basemap that fails to load still lists, and says so', async ({ page }) => {
    await page.route('**/api.mapbox.com/**', (route) => route.fulfill({ status: 503, body: '' }))
    await page.route('**/events.mapbox.com/**', (route) => route.fulfill({ status: 204, body: '' }))
    await page.goto(`${tenant('nwac')}/observations`)

    await expect(page.getByTestId('observation-map').getByRole('alert')).toContainText(
      "The map couldn't load",
    )
    await expect(page.getByText('143 observations within map area')).toBeVisible()
  })

  test('a record the API has no public copy of says so in the modal', async ({ page }) => {
    await stubMap(page)
    await loadPage(page, `${tenant('nwac')}/observations`)
    // Only one fixture record has a detail response; the rest answer 204, as a private one would.
    const card = page.getByTestId('observation-card').filter({ hasText: 'Kendall Lakes' })

    await clickUntil(card, page.getByRole('dialog'))
    await expect(page.getByRole('dialog').getByRole('alert')).toContainText('Not Found')
  })

  test('the filter sheet narrows the list and shows as a removable tag', async ({ page }) => {
    await stubMap(page)
    await loadPage(page, `${tenant('nwac')}/observations`)
    await expect(page.getByTestId('observation-card').first()).toBeVisible()

    await clickUntil(page.getByRole('button', { name: 'Filters' }), page.getByRole('dialog'))
    await page.getByRole('dialog').getByLabel('Avalanches Observed').check()
    await expect(page).toHaveURL(/avalancheObs=true/)
    await page
      .getByRole('dialog')
      .getByRole('button', { name: /View \d+ Results?/ })
      .click()
    await expect(page.getByRole('dialog')).toHaveCount(0)

    const tag = page
      .getByTestId('observation-viewer')
      .getByRole('button', { name: 'Remove filter: Avalanches Observed' })
    await expect(tag).toBeVisible()
    await tag.click()
    await expect(page).not.toHaveURL(/avalancheObs/)
  })
})

test.describe('Native observation pages', () => {
  test('an observation’s own page', async ({ page }) => {
    const errors = await loadPage(page, `${tenant('nwac')}/observations/${OBSERVATION}`)

    await expect(page.getByRole('heading', { name: 'Field Observation', level: 1 })).toBeVisible()
    await expect(page.getByText('Lanham Lake').first()).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Weather', exact: true })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Snowpack', exact: true })).toBeVisible()
    // A forecaster's observation carries no "not reviewed" disclaimer.
    await expect(page.getByText('has not been reviewed for accuracy')).toHaveCount(0)
    expect(errors).toEqual([])
  })

  test('an avalanche’s own page', async ({ page }) => {
    await loadPage(page, `${tenant('nwac')}/observations/avalanches/${AVALANCHE}`)

    await expect(
      page.getByRole('heading', { name: 'Avalanche Occurrence', level: 1 }),
    ).toBeVisible()
    await expect(
      page.getByText('This avalanche has not been confirmed by a forecaster.'),
    ).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Characteristics' })).toBeVisible()
    await expect(page.getByText('has not been reviewed for accuracy')).toBeVisible()
  })

  test('a missing record is a visible "not found", never an empty page', async ({ page }) => {
    await loadPage(page, `${tenant('nwac')}/observations/${MISSING}`)
    await expect(page.getByRole('alert').filter({ hasText: 'Not Found' })).toContainText(
      'doesn’t exist or is private',
    )
  })

  test('a legacy widget hash link lands on the native page', async ({ page }) => {
    await stubMap(page)
    await page.goto(`${tenant('nwac')}/observations/#/view/avalanches/${AVALANCHE}`)
    await expect(page).toHaveURL(new RegExp(`/observations/avalanches/${AVALANCHE}$`))
    await expect(
      page.getByRole('heading', { name: 'Avalanche Occurrence', level: 1 }),
    ).toBeVisible()
  })
})

test.describe('Native observations at phone width', () => {
  test.use({ viewport: PHONE })

  test('the list scrolls up over the map, and a button brings the map back', async ({ page }) => {
    await stubMap(page)
    await loadPage(page, `${tenant('nwac')}/observations`)
    await expect(page.getByTestId('observation-card').first()).toBeVisible()

    const mapButton = page.getByRole('button', { name: 'Map', exact: true })
    await expect(mapButton).toHaveCount(0)
    await page.getByTestId('observation-card').last().scrollIntoViewIfNeeded()
    await expect(mapButton).toBeVisible()

    // The desktop-only expand control stays out of the way, and nothing is wider than the phone.
    await expect(page.getByRole('button', { name: 'Expand map' })).toBeHidden()
    const width = await page.evaluate(() => document.documentElement.scrollWidth)
    expect(width).toBeLessThanOrEqual(PHONE.width)
  })
})
