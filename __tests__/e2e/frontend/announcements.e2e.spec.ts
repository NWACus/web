import { expect, test } from '@playwright/test'

const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'localhost:3000'
const TENANT = 'nwac'
const TENANT_BASE_URL = `http://${TENANT}.${ROOT_DOMAIN}`

test.describe('Announcement banners', () => {
  test.describe.configure({ timeout: 60000 })

  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      // Mark popups as dismissed so they don't overlay banner tests
      const original = Storage.prototype.getItem
      Storage.prototype.getItem = function (key: string) {
        if (key.startsWith('announcement-popup-')) {
          return JSON.stringify({ dismissed: true, visitCount: 100 })
        }
        if (key === 'announcement-banners') return null
        return original.call(this, key)
      }
    })
  })

  test('banner is visible on the homepage', async ({ page }) => {
    await page.goto(`${TENANT_BASE_URL}/`)
    await page.waitForLoadState('load')

    await expect(page.getByText('Backcountry Access Road Closure')).toBeVisible({ timeout: 10000 })
  })

  test('banner can be collapsed and expanded', async ({ page }) => {
    await page.goto(`${TENANT_BASE_URL}/`)
    await page.waitForLoadState('load')

    await expect(page.getByText('Backcountry Access Road Closure')).toBeVisible({ timeout: 10000 })

    await page.getByRole('button', { name: 'Collapse announcements' }).click()

    const expandButton = page.getByRole('button', { name: /\d+ announcement/ })
    await expect(expandButton).toBeVisible()

    await expandButton.click()

    await expect(page.getByText('Backcountry Access Road Closure')).toBeVisible()
  })

  test('expired banner is not shown', async ({ page }) => {
    await page.goto(`${TENANT_BASE_URL}/`)
    await page.waitForLoadState('load')

    await expect(page.getByText('Past Season Summary Available')).not.toBeVisible()
  })

  test('banner is visible on non-homepage routes', async ({ page }) => {
    await page.goto(`${TENANT_BASE_URL}/blog`)
    await page.waitForLoadState('load')

    await expect(page.getByText('Backcountry Access Road Closure')).toBeVisible({ timeout: 10000 })
  })
})

test.describe('Announcement popups', () => {
  test.describe.configure({ timeout: 60000 })

  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      // Clear all popup state so popups appear fresh
      const original = Storage.prototype.getItem
      Storage.prototype.getItem = function (key: string) {
        if (key.startsWith('announcement-popup-')) return null
        return original.call(this, key)
      }
    })
  })

  test('popup appears on the homepage', async ({ page }) => {
    await page.goto(`${TENANT_BASE_URL}/`)
    await page.waitForLoadState('load')

    // Seed popup has a 1s delay before appearing
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 10000 })
    await expect(page.getByRole('heading', { name: 'Annual Fundraiser Gala' })).toBeVisible()
    await expect(page.getByText('Get Tickets')).toBeVisible()
  })

  test('popup can be dismissed', async ({ page }) => {
    await page.goto(`${TENANT_BASE_URL}/`)
    await page.waitForLoadState('load')

    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 10000 })

    // Close via the X button
    await page.getByRole('button', { name: 'Close' }).click()

    await expect(page.getByRole('dialog')).not.toBeVisible()
  })

  test('homepage-only popup does not appear on other pages', async ({ page }) => {
    await page.goto(`${TENANT_BASE_URL}/blog`)
    await page.waitForLoadState('load')

    // Wait longer than the popup delay (1s) to confirm it doesn't appear
    await page.waitForTimeout(2000)
    await expect(page.getByRole('dialog')).not.toBeVisible()
  })
})
