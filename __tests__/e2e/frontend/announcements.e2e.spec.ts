import { expect, test, type Page } from '@playwright/test'
import { tenantBaseUrl } from '../helpers/tenant-url'

const TENANT_BASE_URL = tenantBaseUrl('nwac')

/** Marks popups as dismissed so they don't overlay banner tests. */
async function dismissPopups(page: Page) {
  await page.addInitScript(() => {
    const original = Storage.prototype.getItem
    Storage.prototype.getItem = function (key: string) {
      if (key.startsWith('announcement-popup-')) {
        return JSON.stringify({ dismissed: true, visitCount: 100 })
      }
      if (key === 'announcement-banners') return null
      return original.call(this, key)
    }
  })
}

test.describe('Announcement banners', () => {
  test.describe.configure({ timeout: 60000 })

  test.beforeEach(async ({ page }) => {
    await dismissPopups(page)
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

    const expandButton = page.getByRole('button', { name: /\d+ announcement/i })
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

  // Each test runs in an isolated context with empty storage, so popups start fresh.

  test('popup appears on the homepage', async ({ page }) => {
    await page.goto(`${TENANT_BASE_URL}/`)
    await page.waitForLoadState('load')

    // Seed popup has a 1s delay before appearing
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 10000 })
    await expect(page.getByRole('heading', { name: 'Annual Fundraiser Gala' })).toBeVisible()
  })

  test('popup can be dismissed', async ({ page }) => {
    await page.goto(`${TENANT_BASE_URL}/`)
    await page.waitForLoadState('load')

    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 10000 })

    // Close via the X button
    await page.getByRole('button', { name: 'Close' }).click()

    await expect(page.getByRole('dialog')).not.toBeVisible()
  })

  test('popup is permanently dismissed via "Don\'t show this again"', async ({ page }) => {
    await page.goto(`${TENANT_BASE_URL}/`)
    await page.waitForLoadState('load')

    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 10000 })

    await page.getByRole('button', { name: "Don't show this again" }).click()

    await expect(page.getByRole('dialog')).not.toBeVisible()

    // Reload and verify the popup does not reappear
    await page.reload()
    await page.waitForLoadState('load')
    await page.waitForTimeout(2000)
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
