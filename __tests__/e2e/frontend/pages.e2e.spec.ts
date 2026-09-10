import { expect, test } from '@playwright/test'
import { type TenantSlug, tenantBaseUrl } from '../helpers/tenant-url'

const TENANT_BASE_URL = tenantBaseUrl('nwac')

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

test.describe('Providers embed states filter', () => {
  test.describe.configure({ timeout: 60000 })

  // Seeded providers cover CA, CO, ID, WA and WY; none cover OR.
  const SEEDED_STATES = ['California', 'Colorado', 'Idaho', 'Washington', 'Wyoming']

  test('states param keeps only the given states, case-insensitively, and expands them', async ({
    page,
  }) => {
    const errors = await loadPage(page, '/embeds/providers?states=wa,or')

    const washington = page.getByRole('button', { name: 'Washington' })
    await expect(washington).toBeVisible()
    await expect(washington).toHaveAttribute('data-state', 'open')
    await expect(page.getByText('Mountain Education Center')).toBeVisible()

    for (const state of SEEDED_STATES.filter((name) => name !== 'Washington')) {
      await expect(page.getByRole('button', { name: state })).toHaveCount(0)
    }
    // A selected state with no providers is not rendered as an empty section
    await expect(page.getByRole('button', { name: 'Oregon' })).toHaveCount(0)

    expect(errors).toEqual([])
  })

  test('a filter matching no providers shows a message, not a blank embed', async ({ page }) => {
    const errors = await loadPage(page, '/embeds/providers?states=OR')

    await expect(page.getByText('No providers found for the selected states.')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Oregon' })).toHaveCount(0)

    expect(errors).toEqual([])
  })

  test('without a states param every state renders collapsed', async ({ page }) => {
    const errors = await loadPage(page, '/embeds/providers')

    for (const state of SEEDED_STATES) {
      const trigger = page.getByRole('button', { name: state })
      await expect(trigger).toBeVisible()
      await expect(trigger).toHaveAttribute('data-state', 'closed')
    }

    expect(errors).toEqual([])
  })
})

test.describe('Tenant routing', () => {
  test.describe.configure({ timeout: 60000 })

  test('an internal redirect resolves to its target page', async ({ page }) => {
    const errors = await loadPage(page, `${TENANT_BASE_URL}/redirect-to-about`)

    await expect(page).toHaveURL(/\/about\/about-us$/)
    await expect(page.getByRole('heading', { name: 'About Us', level: 1 })).toBeVisible()

    expect(errors).toEqual([])
  })

  test('an external redirect leaves the site', async ({ page }) => {
    // Stub the destination so the test never depends on the real site
    await page.route('https://avalanche.org/**', (route) =>
      route.fulfill({ status: 200, contentType: 'text/html', body: '<h1>stub</h1>' }),
    )

    await page.goto(`${TENANT_BASE_URL}/redirect-to-external`)

    await expect(page).toHaveURL('https://avalanche.org/')
  })

  const TENANTS: TenantSlug[] = ['nwac', 'sac']
  for (const tenant of TENANTS) {
    test(`robots.txt and sitemap.xml are served for ${tenant}`, async ({ page }) => {
      const origin = tenantBaseUrl(tenant)

      const robots = await page.goto(`${origin}/robots.txt`)
      expect(robots?.status()).toBe(200)
      const robotsText = (await robots?.text()) ?? ''
      expect(robotsText).toContain('Disallow: /admin')
      expect(robotsText).toContain(`Sitemap: ${origin}/sitemap.xml`)

      const sitemap = await page.goto(`${origin}/sitemap.xml`)
      expect(sitemap?.status()).toBe(200)
      const sitemapText = (await sitemap?.text()) ?? ''
      expect(sitemapText).toContain(`${origin}/pages-sitemap.xml`)
      expect(sitemapText).toContain(`${origin}/posts-sitemap.xml`)
    })
  }

  test('an unknown path renders the themed 404', async ({ page }) => {
    const response = await page.goto(`${TENANT_BASE_URL}/this-page-does-not-exist-e2e`)
    expect(response?.status()).toBe(404)

    await expect(page.getByRole('heading', { name: 'Route not found' })).toBeVisible()
    // Still wrapped in the tenant's chrome and theme
    await expect(page.locator('header')).toBeVisible()
    await expect(page.locator('footer')).toBeVisible()
    await expect(page.locator('div.nwac')).toBeVisible()
    await expect(page.getByRole('link', { name: 'Back to home' })).toBeVisible()
  })

  test('two tenants render distinct branding with no bleed', async ({ page }) => {
    const branding = async (tenant: TenantSlug) => {
      const errors = await loadPage(page, `${tenantBaseUrl(tenant)}/`)
      expect(errors).toEqual([])
      await expect(page.locator(`div.${tenant}`)).toBeVisible()
      return {
        title: await page.title(),
        headerColor: await page
          .locator('header')
          .evaluate((element) => getComputedStyle(element).backgroundColor),
        footerText: (await page.locator('footer').textContent()) ?? '',
      }
    }

    const nwac = await branding('nwac')
    const sac = await branding('sac')

    expect(nwac.title).toContain('Northwest Avalanche Center')
    expect(sac.title).toContain('Sierra Avalanche Center')
    expect(nwac.footerText).toContain('info@nwac.us')
    expect(sac.footerText).toContain('info@sierraavalanchecenter.org')
    expect(nwac.footerText).not.toContain('info@sierraavalanchecenter.org')
    expect(sac.footerText).not.toContain('info@nwac.us')
    expect(nwac.headerColor).not.toBe(sac.headerColor)
  })
})
