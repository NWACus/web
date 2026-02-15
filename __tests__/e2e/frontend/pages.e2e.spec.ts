import { expect, test } from '@playwright/test'

const TENANT = 'nwac'
const TENANT_BASE_URL = `http://${TENANT}.localhost:3000`

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

test.describe('Frontend pages load correctly', () => {
  test.describe.configure({ timeout: 60000 })

  test('root landing page', async ({ page }) => {
    const errors = trackPageErrors(page)

    await page.goto('http://localhost:3000/', { waitUntil: 'load' })

    await expect(page.getByRole('heading', { name: 'Avalanche Centers' })).toBeVisible()
    // Should have at least one link to an avalanche center
    await expect(page.locator('a[href*="localhost"]').first()).toBeVisible()

    expect(errors).toEqual([])
  })

  test('tenant homepage', async ({ page }) => {
    const errors = trackPageErrors(page)

    await page.goto(`${TENANT_BASE_URL}/`, { waitUntil: 'load' })

    await expect(page.locator('header')).toBeVisible()
    await expect(page.locator('footer')).toBeVisible()
    // Homepage renders NACWidget containers
    await expect(page.locator('main')).toBeVisible()

    expect(errors).toEqual([])
  })

  test('blog listing page', async ({ page }) => {
    const errors = trackPageErrors(page)

    await page.goto(`${TENANT_BASE_URL}/blog`, { waitUntil: 'load' })

    await expect(page.locator('header')).toBeVisible()
    await expect(page.locator('footer')).toBeVisible()
    await expect(page.locator('main')).toBeVisible()

    expect(errors).toEqual([])
  })

  test('events listing page', async ({ page }) => {
    const errors = trackPageErrors(page)

    await page.goto(`${TENANT_BASE_URL}/events`, { waitUntil: 'load' })

    await expect(page.locator('header')).toBeVisible()
    await expect(page.locator('footer')).toBeVisible()
    await expect(page.locator('main')).toBeVisible()

    expect(errors).toEqual([])
  })

  test('observations page', async ({ page }) => {
    const errors = trackPageErrors(page)

    await page.goto(`${TENANT_BASE_URL}/observations`, { waitUntil: 'load' })

    await expect(page.locator('header')).toBeVisible()
    await expect(page.locator('footer')).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Observations' })).toBeVisible()

    expect(errors).toEqual([])
  })

  test('avalanche forecast page', async ({ page }) => {
    const errors = trackPageErrors(page)

    await page.goto(`${TENANT_BASE_URL}/forecasts/avalanche`, { waitUntil: 'load' })

    await expect(page.locator('header')).toBeVisible()
    await expect(page.locator('footer')).toBeVisible()
    await expect(page.locator('main')).toBeVisible()

    expect(errors).toEqual([])
  })

  test('weather forecast page', async ({ page }) => {
    const errors = trackPageErrors(page)

    await page.goto(`${TENANT_BASE_URL}/weather/forecast`, { waitUntil: 'load' })

    await expect(page.locator('header')).toBeVisible()
    await expect(page.locator('footer')).toBeVisible()
    await expect(page.locator('main')).toBeVisible()

    expect(errors).toEqual([])
  })

  test('weather stations map page', async ({ page }) => {
    const errors = trackPageErrors(page)

    await page.goto(`${TENANT_BASE_URL}/weather/stations/map`, { waitUntil: 'load' })

    await expect(page.locator('header')).toBeVisible()
    await expect(page.locator('footer')).toBeVisible()
    await expect(page.locator('main')).toBeVisible()

    expect(errors).toEqual([])
  })
})

test.describe('Embed pages load correctly', () => {
  test.describe.configure({ timeout: 60000 })

  test('courses embed', async ({ page }) => {
    const errors = trackPageErrors(page)

    await page.goto('http://localhost:3000/embeds/courses', { waitUntil: 'load' })

    await expect(page.locator('body')).toBeVisible()
    // The courses page should render without errors
    await expect(page.locator('main, [class*="courses"], body > div').first()).toBeVisible()

    expect(errors).toEqual([])
  })

  test('providers embed', async ({ page }) => {
    const errors = trackPageErrors(page)

    await page.goto('http://localhost:3000/embeds/providers', { waitUntil: 'load' })

    await expect(page.locator('body')).toBeVisible()
    // The providers page should render without errors
    await expect(page.locator('main, [class*="provider"], body > div').first()).toBeVisible()

    expect(errors).toEqual([])
  })
})
