import { authTest, expect } from '../../fixtures/auth.fixture'
import { UserRole } from '../../fixtures/test-users'
import { AdminUrlUtil, CollectionSlugs } from '../../helpers'

const SERVER_URL = 'http://localhost:3000'
const mcpApiKeysUrl = new AdminUrlUtil(SERVER_URL, CollectionSlugs.mcpApiKeys)

// Every role except superAdmin should be denied access
const deniedRoles: UserRole[] = [
  'providerManager',
  'multiTenantAdmin',
  'singleTenantAdmin',
  'singleTenantForecaster',
  'singleTenantStaff',
  'providerUser',
  'multiProviderUser',
]

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

    for (const role of deniedRoles) {
      authTest(`${role} cannot access MCP API Keys documents`, async ({ loginAs }) => {
        const page = await loginAs(role)

        await page.goto(mcpApiKeysUrl.list)
        await page.waitForLoadState('networkidle')

        // Payload hides the collection from non-super-admins entirely,
        // rendering a "Not Found" page instead of the list view.
        await expect(page.locator('text=Nothing found')).toBeVisible({ timeout: 10000 })
      })
    }
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
