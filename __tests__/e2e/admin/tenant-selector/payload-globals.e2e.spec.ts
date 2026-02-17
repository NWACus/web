import {
  expect,
  TenantNames,
  tenantSelectorTest as test,
} from '../../fixtures/tenant-selector.fixture'
import { AdminUrlUtil, CollectionSlugs, GlobalSlugs } from '../../helpers'

/**
 * Payload Globals Tests
 *
 * Single-document globals (not collections).
 * These are system-wide configuration documents.
 *
 * Examples: A3Management, NACWidgetsConfig, Diagnostics
 *
 * Expected behavior:
 * - Tenant selector is hidden
 * - Tenant cookie value is NOT changed when visiting
 * - Document is accessible regardless of current tenant cookie
 */

test.describe.configure({ timeout: 90000 })

test.describe('Payload Global', () => {
  test.describe('A3Management', () => {
    test('tenant selector should be hidden', async ({ loginAs, isTenantSelectorVisible }) => {
      const page = await loginAs('superAdmin')
      const url = new AdminUrlUtil('http://localhost:3000', '')

      await page.goto(url.global(GlobalSlugs.a3Management))
      await page.waitForLoadState('networkidle')

      const isVisible = await isTenantSelectorVisible(page)
      expect(isVisible).toBe(false)

      await page.context().close()
    })

    test('should be accessible regardless of tenant cookie', async ({ loginAs, selectTenant }) => {
      const page = await loginAs('superAdmin')
      const globalUrl = new AdminUrlUtil('http://localhost:3000', '')
      const settingsUrl = new AdminUrlUtil('http://localhost:3000', CollectionSlugs.settings)

      // Select NWAC tenant via UI
      await page.goto(settingsUrl.list)
      await page.waitForLoadState('networkidle')
      await selectTenant(page, TenantNames.nwac)
      await page.waitForLoadState('networkidle')

      // Visit global - should load successfully
      await page.goto(globalUrl.global(GlobalSlugs.a3Management))
      await page.waitForLoadState('networkidle')
      await expect(page.locator('h1')).toContainText('A3 Management', { timeout: 10000 })

      // Switch to SNFAC tenant via UI
      await page.goto(settingsUrl.list)
      await page.waitForLoadState('networkidle')
      await selectTenant(page, TenantNames.snfac)
      await page.waitForLoadState('networkidle')

      // Visit global again - should still load successfully
      await page.goto(globalUrl.global(GlobalSlugs.a3Management))
      await page.waitForLoadState('networkidle')
      await expect(page.locator('h1')).toContainText('A3 Management', { timeout: 10000 })

      await page.context().close()
    })
  })

  test.describe('NACWidgetsConfig', () => {
    test('tenant selector should be hidden', async ({ loginAs, isTenantSelectorVisible }) => {
      const page = await loginAs('superAdmin')
      const url = new AdminUrlUtil('http://localhost:3000', '')

      await page.goto(url.global(GlobalSlugs.nacWidgetsConfig))
      await page.waitForLoadState('networkidle')

      const isVisible = await isTenantSelectorVisible(page)
      expect(isVisible).toBe(false)

      await page.context().close()
    })
  })

  test.describe('Diagnostics', () => {
    test('tenant selector should be hidden', async ({ loginAs, isTenantSelectorVisible }) => {
      const page = await loginAs('superAdmin')
      const url = new AdminUrlUtil('http://localhost:3000', '')

      await page.goto(url.global(GlobalSlugs.diagnostics))
      await page.waitForLoadState('networkidle')

      const isVisible = await isTenantSelectorVisible(page)
      expect(isVisible).toBe(false)

      await page.context().close()
    })
  })

  test.describe('Cookie Preservation', () => {
    test('tenant cookie should not change when visiting globals', async ({
      loginAs,
      selectTenant,
      getTenantCookie,
      isTenantSelectorVisible,
    }) => {
      const page = await loginAs('superAdmin')
      const settingsUrl = new AdminUrlUtil('http://localhost:3000', CollectionSlugs.settings)
      const globalUrl = new AdminUrlUtil('http://localhost:3000', '')
      const pagesUrl = new AdminUrlUtil('http://localhost:3000', CollectionSlugs.pages)

      // Set a valid tenant cookie via UI
      await page.goto(settingsUrl.list)
      await page.waitForLoadState('networkidle')
      await selectTenant(page, TenantNames.nwac)
      await page.waitForLoadState('networkidle')

      const cookieBefore = await getTenantCookie(page)
      expect(cookieBefore).toBeTruthy()

      // Visit a global
      await page.goto(globalUrl.global(GlobalSlugs.a3Management))
      await page.waitForLoadState('networkidle')

      // Selector should be hidden on globals
      const isVisible = await isTenantSelectorVisible(page)
      expect(isVisible).toBe(false)

      // Cookie should be unchanged
      const cookieAfterGlobal = await getTenantCookie(page)
      expect(cookieAfterGlobal).toBe(cookieBefore)

      // Navigate to a tenant collection
      await page.goto(pagesUrl.list)
      await page.waitForLoadState('networkidle')

      // Cookie should still be preserved
      const cookieAfterCollection = await getTenantCookie(page)
      expect(cookieAfterCollection).toBe(cookieBefore)

      await page.context().close()
    })
  })
})
