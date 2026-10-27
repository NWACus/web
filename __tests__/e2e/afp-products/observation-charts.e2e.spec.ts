import type { Page } from '@playwright/test'

import { expect, test } from './fixture'
import { loadPage, stubObservationMap as stubMap, tenant } from './helpers'

/**
 * Inventory row O3 — the native observation viewer's charts tab (#1338). The stats endpoint is
 * mocked from one scrubbed capture (three months of NWAC avalanches, bucketed by week), so these
 * assert what the tab renders from it and what it asks for, not the aggregation. ECharts draws
 * on a canvas; what a browser can assert on is each card's heading, state and controls.
 */

const STATS = '**/api/*/observations/avalanches/stats**'

const CHART_TITLES = [
  'Avalanches by Zone',
  'Trigger',
  'Size',
  'Aspect & Elevation',
  'Avalanche Problem',
  'Avalanches Over Time',
  'Instability Over Time',
]

function charts(page: Page) {
  return page.getByTestId('observation-chart')
}

/** The cards in one state, for asserting all seven are. */
function chartsIn(page: Page, state: 'ready' | 'empty' | 'error') {
  return page.locator(`[data-testid="observation-chart"][data-chart-state="${state}"]`)
}

test.describe('Native observation charts', () => {
  test('the charts tab renders all seven charts for the viewport', async ({ page }) => {
    await stubMap(page)
    const statsRequest = page.waitForRequest(STATS)
    const errors = await loadPage(page, `${tenant('nwac')}/observations/charts`)

    await expect(page.getByText('417 avalanches within map area')).toBeVisible()
    await expect(charts(page)).toHaveCount(7)
    for (const title of CHART_TITLES) {
      await expect(page.getByRole('heading', { name: title, level: 2 })).toBeVisible()
    }
    await expect(chartsIn(page, 'ready')).toHaveCount(7)
    await expect(page.locator('[data-testid="observation-chart"] canvas')).toHaveCount(7)
    // Every card saves itself, and the rose switches between circles and numbers.
    await expect(page.getByRole('button', { name: /^Download .* chart$/ })).toHaveCount(7)
    await page.getByRole('radio', { name: 'Numbers' }).click()
    await expect(page.getByRole('radio', { name: 'Numbers' })).toHaveAttribute('data-state', 'on')
    // The list stays unfetched: this tab's one read is the stats.
    const url = new URL((await statsRequest).url())
    expect(url.searchParams.get('bbox')).toMatch(/^-?\d+\.\d{5},/)
    expect(url.searchParams.has('page')).toBe(false)
    expect(errors).toEqual([])
  })

  test('the filters change the request, and switching tabs keeps them', async ({ page }) => {
    await stubMap(page)
    await loadPage(page, `${tenant('nwac')}/observations/charts`)
    await expect(chartsIn(page, 'ready')).toHaveCount(7)

    const filtered = page.waitForRequest(
      (request) => request.url().includes('/avalanches/stats') && request.url().includes('trigger'),
    )
    await page.getByRole('button', { name: /^Filters/ }).click()
    await page.getByRole('checkbox', { name: 'Human' }).check()
    const url = new URL((await filtered).url())
    expect(url.searchParams.get('trigger')).toBe('["Human"]')
    await page.keyboard.press('Escape')
    await expect(page.getByRole('button', { name: 'Remove filter: Human' })).toBeVisible()

    // The avalanches tab opens with the same filters, from its own address.
    await page.getByRole('link', { name: 'Avalanches', exact: true }).click()
    await expect(page).toHaveURL(/\/observations\/avalanches\?.*trigger=/)
    await expect(page.getByTestId('observation-charts')).toHaveCount(0)
    await expect(page.getByTestId('avalanche-card').first()).toBeVisible()
  })

  test('a window with no avalanches says so on every chart', async ({ page }) => {
    await stubMap(page)
    await loadPage(page, `${tenant('nwac')}/observations/charts?trigger=%5B%22Wildlife%22%5D`)

    await expect(page.getByText('0 avalanches within map area')).toBeVisible()
    await expect(chartsIn(page, 'empty')).toHaveCount(7)
    await expect(page.getByText('No avalanches', { exact: true })).toHaveCount(5)
    await expect(page.getByText('No avalanche data for selected period')).toBeVisible()
    await expect(page.getByText('No observation data for selected period')).toBeVisible()
    await expect(page.getByRole('button', { name: /^Download .* chart$/ }).first()).toBeDisabled()
  })

  test('a failed stats read is a visible error on every chart, not a blank tab', async ({
    page,
  }) => {
    await stubMap(page)
    await page.route(STATS, (route) => route.fulfill({ status: 502, body: '{}' }))
    await loadPage(page, `${tenant('nwac')}/observations/charts`)

    await expect(page.getByRole('alert').filter({ hasText: 'avalanche statistics' })).toBeVisible()
    await expect(chartsIn(page, 'error')).toHaveCount(7)
  })

  test('a legacy #/view/visual link lands on the charts tab with its filters', async ({ page }) => {
    await stubMap(page)
    await page.goto(`${tenant('nwac')}/observations/#/view/visual?trigger=%5B%22Human%22%5D`)
    await expect(page).toHaveURL(/\/observations\/charts\?trigger=%5B%22Human%22%5D$/)
    await expect(page.getByRole('heading', { name: 'Avalanches by Zone', level: 2 })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Remove filter: Human' })).toBeVisible()
  })

  test('a widget tenant keeps the widget’s Visual view at the charts address', async ({ page }) => {
    const errors = await loadPage(page, `${tenant('sac')}/observations/charts`)
    await expect(page.locator('#widget-container[data-widget="observations"]')).toBeVisible()
    await expect(page).toHaveURL(/#\/view\/visual$/)
    await expect(page.getByTestId('observation-viewer')).toHaveCount(0)
    expect(errors).toEqual([])
  })
})
