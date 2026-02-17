import { expect, test } from '@playwright/test'

const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'localhost:3000'
const TENANT = 'nwac'
const TENANT_BASE_URL = `http://${TENANT}.${ROOT_DOMAIN}`

/**
 * Helper to set up error tracking for a page.
 * Captures uncaught JS errors and 5xx server responses so tests can assert
 * that pages load without errors.
 */
function trackPageErrors(page: import('@playwright/test').Page) {
  const errors: string[] = []

  page.on('pageerror', (error) => {
    errors.push(`JS Error: ${error.message}`)
  })

  page.on('response', (response) => {
    // Only track document/page responses, not external resources
    const url = response.url()
    if (response.status() >= 500 && !url.includes('_next/static')) {
      errors.push(`HTTP ${response.status()} on ${url}`)
    }
  })

  return errors
}

/**
 * Navigates to a URL and asserts the page loaded successfully (not a 404/500).
 * Returns the tracked errors array for further assertions.
 */
async function loadPage(page: import('@playwright/test').Page, url: string) {
  const errors = trackPageErrors(page)
  const response = await page.goto(url, { waitUntil: 'load' })

  // Assert the page returned a successful HTTP status
  expect(response?.status(), `Expected 2xx status for ${url}`).toBeLessThan(400)

  // Assert no 404 content rendered
  await expect(page.getByRole('heading', { name: 'Route not found' })).not.toBeVisible()

  return errors
}

test.describe('Frontend pages load correctly', () => {
  test.describe.configure({ timeout: 60000 })

  test('root landing page', async ({ page }) => {
    const errors = await loadPage(page, '/')

    await expect(page.getByRole('heading', { name: 'Avalanche Centers' })).toBeVisible()
    // Should have at least one link to an avalanche center
    await expect(page.locator('a[href*="localhost"]').first()).toBeVisible()

    expect(errors).toEqual([])
  })

  test('tenant homepage', async ({ page }) => {
    const errors = await loadPage(page, `${TENANT_BASE_URL}/`)

    await expect(page.locator('header')).toBeVisible()
    await expect(page.locator('footer')).toBeVisible()

    await expect(page.locator('#widget-container[data-widget="map"]')).toBeVisible()

    expect(errors).toEqual([])
  })

  test('blog listing page', async ({ page }) => {
    const errors = await loadPage(page, `${TENANT_BASE_URL}/blog`)

    await expect(page.locator('header')).toBeVisible()
    await expect(page.locator('footer')).toBeVisible()

    await expect(page.getByRole('heading', { name: 'Sort' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Filter by tag' })).toBeVisible()

    expect(errors).toEqual([])
  })

  test('events listing page', async ({ page }) => {
    const errors = await loadPage(page, `${TENANT_BASE_URL}/events`)

    await expect(page.locator('header')).toBeVisible()
    await expect(page.locator('footer')).toBeVisible()

    await expect(page.getByRole('heading', { name: 'Filter by date' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Filter by type' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Mode of Travel' })).toBeVisible()

    // "Upcoming" quick filter is selected by default
    await expect(page.getByRole('button', { name: 'Upcoming' })).toBeVisible()

    // Custom date range: click button, verify date pickers appear
    await page.getByRole('button', { name: 'Custom date range' }).click()
    await expect(page.getByLabel('Start Date')).toBeVisible()
    await expect(page.getByLabel('End Date')).toBeVisible()

    expect(errors).toEqual([])
  })

  test('observations page', async ({ page }) => {
    const errors = await loadPage(page, `${TENANT_BASE_URL}/observations`)

    await expect(page.locator('header')).toBeVisible()
    await expect(page.locator('footer')).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Observations' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Submit Observation' })).toBeVisible()

    expect(errors).toEqual([])
  })

  test('avalanche all forecast page', async ({ page }) => {
    const errors = await loadPage(page, `${TENANT_BASE_URL}/forecasts/avalanche`)

    await expect(page.locator('header')).toBeVisible()
    await expect(page.locator('footer')).toBeVisible()
    await expect(page.locator('#widget-container[data-widget="forecast"]')).toBeVisible()

    expect(errors).toEqual([])
  })

  test('weather stations map page', async ({ page }) => {
    const errors = await loadPage(page, `${TENANT_BASE_URL}/weather/stations/map`)

    await expect(page.locator('header')).toBeVisible()
    await expect(page.locator('footer')).toBeVisible()
    await expect(page.locator('#widget-container[data-widget="stations"]')).toBeVisible()

    expect(errors).toEqual([])
  })
})

test.describe('Embed pages load correctly', () => {
  test.describe.configure({ timeout: 60000 })

  test('courses embed', async ({ page }) => {
    const errors = await loadPage(page, '/embeds/courses')

    // A3 banner is present
    await expect(page.getByAltText('A3 Logo')).toBeVisible()
    // Courses list renders (either course items or empty state message)
    await expect(page.locator('.divide-y').or(page.getByText('No courses found'))).toBeVisible()

    expect(errors).toEqual([])
  })

  test('providers embed', async ({ page }) => {
    const errors = await loadPage(page, '/embeds/providers')

    // A3 banner is present
    await expect(page.getByAltText('A3 Logo')).toBeVisible()
    // Providers are grouped by state in accordion triggers
    await expect(page.locator('[data-state]').first()).toBeVisible()

    expect(errors).toEqual([])
  })
})
