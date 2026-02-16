import {
  expect,
  TenantNames,
  tenantSelectorTest as test,
} from '../../fixtures/tenant-selector.fixture'
import { AdminUrlUtil, CollectionSlugs } from '../../helpers'

/**
 * Non-Tenant Collection Tests
 *
 * Collections without a tenant field.
 * Documents are shared across all tenants.
 *
 * Examples: Users, Tenants, GlobalRoles, GlobalRoleAssignments, Roles, Courses, Providers
 *
 * Expected behavior:
 * - Tenant selector is hidden on both list and document views
 * - Tenant cookie value is NOT changed when visiting these collections
 * - All documents are visible (subject to user permissions)
 */

// Each test creates its own browser context + login; run with --workers=1
// to avoid overwhelming the dev server with simultaneous login requests.
test.describe.configure({ mode: 'serial', timeout: 90000 })

test.describe('Non-Tenant Collection', () => {
  test.describe('Users', () => {
    test('tenant selector should be hidden on list view', async ({
      loginAs,
      isTenantSelectorVisible,
    }) => {
      const page = await loginAs('superAdmin')
      const url = new AdminUrlUtil('http://localhost:3000', CollectionSlugs.users)

      await page.goto(url.list)
      await page.waitForLoadState('networkidle')

      // Tenant selector should be hidden
      const isVisible = await isTenantSelectorVisible(page)
      expect(isVisible).toBe(false)

      await page.context().close()
    })

    test('tenant selector should be hidden on document view', async ({
      loginAs,
      isTenantSelectorVisible,
    }) => {
      const page = await loginAs('superAdmin')
      const url = new AdminUrlUtil('http://localhost:3000', CollectionSlugs.users)

      await page.goto(url.list)
      await page.waitForLoadState('networkidle')

      // Click first user in list
      const firstRow = page.locator('table tbody tr').first()
      if (await firstRow.isVisible()) {
        await firstRow.click()
        await page.waitForLoadState('networkidle')

        const isVisible = await isTenantSelectorVisible(page)
        expect(isVisible).toBe(false)
      }

      await page.context().close()
    })

    test('all users should be visible regardless of tenant cookie', async ({
      loginAs,
      selectTenant,
    }) => {
      const page = await loginAs('superAdmin')
      const usersUrl = new AdminUrlUtil('http://localhost:3000', CollectionSlugs.users)
      const settingsUrl = new AdminUrlUtil('http://localhost:3000', CollectionSlugs.settings)

      // Select NWAC tenant via UI on a tenant-scoped collection
      await page.goto(settingsUrl.list)
      await page.waitForLoadState('networkidle')
      await selectTenant(page, TenantNames.nwac)
      await page.waitForLoadState('networkidle')

      // Visit users collection and count rows
      await page.goto(usersUrl.list)
      await page.waitForLoadState('networkidle')
      const nwacUserCount = await page.locator('table tbody tr').count()

      // Switch to SNFAC tenant via UI
      await page.goto(settingsUrl.list)
      await page.waitForLoadState('networkidle')
      await selectTenant(page, TenantNames.snfac)
      await page.waitForLoadState('networkidle')

      // Visit users collection again and count rows
      await page.goto(usersUrl.list)
      await page.waitForLoadState('networkidle')
      const snfacUserCount = await page.locator('table tbody tr').count()

      // User count should be the same regardless of tenant (no filtering)
      expect(nwacUserCount).toBe(snfacUserCount)

      await page.context().close()
    })
  })

  test.describe('Tenants', () => {
    test('tenant selector should be hidden', async ({ loginAs, isTenantSelectorVisible }) => {
      const page = await loginAs('superAdmin')
      const url = new AdminUrlUtil('http://localhost:3000', CollectionSlugs.tenants)

      await page.goto(url.list)
      await page.waitForLoadState('networkidle')

      const isVisible = await isTenantSelectorVisible(page)
      expect(isVisible).toBe(false)

      await page.context().close()
    })
  })

  test.describe('GlobalRoles', () => {
    test('tenant selector should be hidden', async ({ loginAs, isTenantSelectorVisible }) => {
      const page = await loginAs('superAdmin')
      const url = new AdminUrlUtil('http://localhost:3000', CollectionSlugs.globalRoles)

      await page.goto(url.list)
      await page.waitForLoadState('networkidle')

      const isVisible = await isTenantSelectorVisible(page)
      expect(isVisible).toBe(false)

      await page.context().close()
    })
  })

  test.describe('GlobalRoleAssignments', () => {
    test('tenant selector should be hidden', async ({ loginAs, isTenantSelectorVisible }) => {
      const page = await loginAs('superAdmin')
      const url = new AdminUrlUtil('http://localhost:3000', CollectionSlugs.globalRoleAssignments)

      await page.goto(url.list)
      await page.waitForLoadState('networkidle')

      const isVisible = await isTenantSelectorVisible(page)
      expect(isVisible).toBe(false)

      await page.context().close()
    })
  })

  test.describe('Courses', () => {
    test('tenant selector should be hidden', async ({ loginAs, isTenantSelectorVisible }) => {
      const page = await loginAs('superAdmin')
      const url = new AdminUrlUtil('http://localhost:3000', CollectionSlugs.courses)

      await page.goto(url.list)
      await page.waitForLoadState('networkidle')

      const isVisible = await isTenantSelectorVisible(page)
      expect(isVisible).toBe(false)

      await page.context().close()
    })
  })

  test.describe('Providers', () => {
    test('tenant selector should be hidden', async ({ loginAs, isTenantSelectorVisible }) => {
      const page = await loginAs('superAdmin')
      const url = new AdminUrlUtil('http://localhost:3000', CollectionSlugs.providers)

      await page.goto(url.list)
      await page.waitForLoadState('networkidle')

      const isVisible = await isTenantSelectorVisible(page)
      expect(isVisible).toBe(false)

      await page.context().close()
    })
  })

  test.describe('Cookie Preservation', () => {
    test('tenant cookie should not change when navigating to non-tenant collection', async ({
      loginAs,
      selectTenant,
      getTenantCookie,
    }) => {
      const page = await loginAs('superAdmin')

      // Visit tenant-scoped collection and select a tenant via UI
      const pagesUrl = new AdminUrlUtil('http://localhost:3000', CollectionSlugs.pages)
      await page.goto(pagesUrl.list)
      await page.waitForLoadState('networkidle')
      await selectTenant(page, TenantNames.dvac)
      await page.waitForLoadState('networkidle')

      const cookieBeforeNonTenant = await getTenantCookie(page)
      expect(cookieBeforeNonTenant).toBeTruthy()

      // Navigate to non-tenant collection
      const usersUrl = new AdminUrlUtil('http://localhost:3000', CollectionSlugs.users)
      await page.goto(usersUrl.list)
      await page.waitForLoadState('networkidle')

      // Cookie should still be the same
      const cookieAfterNonTenant = await getTenantCookie(page)
      expect(cookieAfterNonTenant).toBe(cookieBeforeNonTenant)

      // Navigate back to tenant-scoped collection
      await page.goto(pagesUrl.list)
      await page.waitForLoadState('networkidle')

      // Cookie should still be preserved
      const cookieAfterBack = await getTenantCookie(page)
      expect(cookieAfterBack).toBe(cookieBeforeNonTenant)

      await page.context().close()
    })
  })
})
