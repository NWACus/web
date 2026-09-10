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

// Seeded nwac banners: one for all devices ("Backcountry Access Road Closure"),
// one mobile-only ("Text Alerts for Forecast Updates"), one desktop-only
// ("Explore the Interactive Danger Map") and one expired. The split is at
// 1024px (Tailwind `lg`). Device targeting resolves after mount, deliberately,
// to avoid a hydration mismatch — so the server HTML carries every non-expired
// banner and nothing here asserts on first paint.
test.describe('Announcement banner device targeting', () => {
  test.describe.configure({ timeout: 60000 })

  const ALL_DEVICES = 'Backcountry Access Road Closure'
  const MOBILE_ONLY = 'Text Alerts for Forecast Updates'
  const DESKTOP_ONLY = 'Explore the Interactive Danger Map'

  /** Titles of the banners currently rendered in the banner strip. */
  function renderedBannerTitles(page: Page) {
    return page.getByRole('button', { name: 'Collapse announcements' }).locator('..').locator('h3')
  }

  /**
   * Waits for the post-mount device filter by waiting for the banner meant for the
   * other device to leave the DOM. The collapsed strip is a zero-height overflow
   * container, which Playwright's visibility check does not see through, so
   * `toBeVisible` on a banner is not proof the filter has run.
   */
  async function expectDeviceFiltered(page: Page, otherDeviceBanner: string) {
    await expect(page.getByText(otherDeviceBanner)).toHaveCount(0, { timeout: 10000 })
  }

  test.beforeEach(async ({ page }) => {
    await dismissPopups(page)
  })

  test.describe('below the breakpoint', () => {
    test.use({ viewport: { width: 800, height: 900 } })

    test('shows mobile-only banners and drops desktop-only ones', async ({ page }) => {
      await page.goto(`${TENANT_BASE_URL}/`)
      await expectDeviceFiltered(page, DESKTOP_ONLY)

      await expect(page.getByText(MOBILE_ONLY)).toBeVisible()
      await expect(page.getByText(ALL_DEVICES)).toBeVisible()
    })

    test('mobile nav announcement count matches the rendered banners', async ({ page }) => {
      await page.goto(`${TENANT_BASE_URL}/`)
      await expectDeviceFiltered(page, DESKTOP_ONLY)

      const toggle = page.getByRole('button', { name: /\d+ announcements?$/i })
      await expect(toggle).toBeVisible()
      const label = await toggle.getAttribute('aria-label')
      const count = Number(label?.match(/\d+/)?.[0])

      await expect(renderedBannerTitles(page)).toHaveCount(count)
      expect(count).toBe(2)
    })
  })

  test.describe('at or above the breakpoint', () => {
    test.use({ viewport: { width: 1200, height: 900 } })

    test('shows desktop-only banners and drops mobile-only ones', async ({ page }) => {
      await page.goto(`${TENANT_BASE_URL}/`)
      await expectDeviceFiltered(page, MOBILE_ONLY)

      await expect(page.getByText(DESKTOP_ONLY)).toBeVisible()
      await expect(page.getByText(ALL_DEVICES)).toBeVisible()
    })

    test('collapsed count matches the rendered banners', async ({ page }) => {
      await page.goto(`${TENANT_BASE_URL}/`)
      await expectDeviceFiltered(page, MOBILE_ONLY)
      const rendered = await renderedBannerTitles(page).count()

      await page.getByRole('button', { name: 'Collapse announcements' }).click()
      const pill = page.getByRole('button', { name: /^\d+ announcements?$/i })
      await expect(pill).toBeVisible()
      await expect(pill).toContainText(String(rendered))
      expect(rendered).toBe(2)
    })
  })
})
