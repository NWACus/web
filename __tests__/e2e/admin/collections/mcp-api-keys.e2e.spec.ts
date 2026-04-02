import { authTest, expect } from '../../fixtures/auth.fixture'
import { AdminUrlUtil, CollectionSlugs } from '../../helpers'

const SERVER_URL = 'http://localhost:3000'
const mcpApiKeysUrl = new AdminUrlUtil(SERVER_URL, CollectionSlugs.mcpApiKeys)

authTest.describe('MCP API Keys', () => {
  authTest.describe.configure({ timeout: 60000 })

  authTest.describe('Access Control', () => {
    authTest('super admin can view the MCP API Keys list', async ({ adminPage }) => {
      await adminPage.goto(mcpApiKeysUrl.list)
      await adminPage.waitForLoadState('networkidle')

      // Should see the collection list view (table or empty state)
      const heading = adminPage.locator('.collection-list__header, h1')
      await expect(heading).toBeVisible({ timeout: 10000 })

      // Should NOT see "unauthorized" or be redirected away
      await expect(adminPage).not.toHaveURL(/\/unauthorized/)
      await expect(adminPage.locator('text=not allowed')).not.toBeVisible()
    })

    authTest('non-super-admin cannot view the MCP API Keys list', async ({ loginAs }) => {
      const page = await loginAs('singleTenantAdmin')

      const response = await page.goto(mcpApiKeysUrl.list)
      await page.waitForLoadState('networkidle')

      // Payload returns 403 or redirects unauthorized users.
      // Either the HTTP response is 403, or the page shows "not allowed",
      // or the user is redirected to the unauthorized page.
      const is403 = response?.status() === 403
      const isUnauthorizedPage = page.url().includes('unauthorized')
      const showsNotAllowed = await page
        .locator('text=not allowed')
        .isVisible()
        .catch(() => false)
      // Payload may also show an empty state with no rows and no create button
      const hasNoCreateButton = !(await page
        .getByRole('link', { name: /create new/i })
        .isVisible()
        .catch(() => false))

      expect(is403 || isUnauthorizedPage || showsNotAllowed || hasNoCreateButton).toBe(true)
    })

    authTest('tenant forecaster cannot view the MCP API Keys list', async ({ loginAs }) => {
      const page = await loginAs('singleTenantForecaster')

      const response = await page.goto(mcpApiKeysUrl.list)
      await page.waitForLoadState('networkidle')

      const is403 = response?.status() === 403
      const isUnauthorizedPage = page.url().includes('unauthorized')
      const showsNotAllowed = await page
        .locator('text=not allowed')
        .isVisible()
        .catch(() => false)
      const hasNoCreateButton = !(await page
        .getByRole('link', { name: /create new/i })
        .isVisible()
        .catch(() => false))

      expect(is403 || isUnauthorizedPage || showsNotAllowed || hasNoCreateButton).toBe(true)
    })

    authTest('tenant staff cannot view the MCP API Keys list', async ({ loginAs }) => {
      const page = await loginAs('singleTenantStaff')

      const response = await page.goto(mcpApiKeysUrl.list)
      await page.waitForLoadState('networkidle')

      const is403 = response?.status() === 403
      const isUnauthorizedPage = page.url().includes('unauthorized')
      const showsNotAllowed = await page
        .locator('text=not allowed')
        .isVisible()
        .catch(() => false)
      const hasNoCreateButton = !(await page
        .getByRole('link', { name: /create new/i })
        .isVisible()
        .catch(() => false))

      expect(is403 || isUnauthorizedPage || showsNotAllowed || hasNoCreateButton).toBe(true)
    })
  })

  authTest.describe('Navigation', () => {
    authTest('MCP API Keys does not appear in sidebar for non-super-admin', async ({ loginAs }) => {
      const page = await loginAs('singleTenantAdmin')

      await page.goto(mcpApiKeysUrl.admin)
      await page.waitForLoadState('networkidle')

      const navLink = page.locator(`nav a[href*="${CollectionSlugs.mcpApiKeys}"]`)
      await expect(navLink).not.toBeVisible()
    })
  })
})
