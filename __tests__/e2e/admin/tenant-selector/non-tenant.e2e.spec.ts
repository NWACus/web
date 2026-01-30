import {
  expect,
  TenantSlugs,
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

test.describe('Non-Tenant Collection - Users', () => {
  test('tenant selector should be hidden on list view', async ({
    loginAs,
    isTenantSelectorVisible,
    getTenantCookie,
    setTenantCookie,
  }) => {
    const page = await loginAs('superAdmin')
    const url = new AdminUrlUtil('http://localhost:3000', CollectionSlugs.users)

    // Set a known tenant cookie before visiting
    await setTenantCookie(page, TenantSlugs.nwac)
    const cookieBefore = await getTenantCookie(page)

    await page.goto(url.list)
    await page.waitForLoadState('networkidle')

    // Tenant selector should be hidden
    const isVisible = await isTenantSelectorVisible(page)
    expect(isVisible).toBe(false)

    // Cookie should NOT be changed
    const cookieAfter = await getTenantCookie(page)
    expect(cookieAfter).toBe(cookieBefore)

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
    setTenantCookie,
  }) => {
    const page = await loginAs('superAdmin')
    const url = new AdminUrlUtil('http://localhost:3000', CollectionSlugs.users)

    // Set to NWAC first
    await setTenantCookie(page, TenantSlugs.nwac)
    await page.goto(url.list)
    await page.waitForLoadState('networkidle')

    const nwacUserCount = await page.locator('table tbody tr').count()

    // Change to SNFAC
    await setTenantCookie(page, TenantSlugs.snfac)
    await page.goto(url.list)
    await page.waitForLoadState('networkidle')

    const snfacUserCount = await page.locator('table tbody tr').count()

    // User count should be the same regardless of tenant (no filtering)
    expect(nwacUserCount).toBe(snfacUserCount)

    await page.context().close()
  })
})

test.describe('Non-Tenant Collection - Tenants', () => {
  test('tenant selector should be hidden', async ({
    loginAs,
    isTenantSelectorVisible,
    getTenantCookie,
    setTenantCookie,
  }) => {
    const page = await loginAs('superAdmin')
    const url = new AdminUrlUtil('http://localhost:3000', CollectionSlugs.tenants)

    await setTenantCookie(page, TenantSlugs.nwac)
    const cookieBefore = await getTenantCookie(page)

    await page.goto(url.list)
    await page.waitForLoadState('networkidle')

    const isVisible = await isTenantSelectorVisible(page)
    expect(isVisible).toBe(false)

    const cookieAfter = await getTenantCookie(page)
    expect(cookieAfter).toBe(cookieBefore)

    await page.context().close()
  })
})

test.describe('Non-Tenant Collection - GlobalRoles', () => {
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

test.describe('Non-Tenant Collection - Courses', () => {
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

test.describe('Non-Tenant Collection - Providers', () => {
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

test.describe('Non-Tenant Collection - Cookie Preservation', () => {
  test('tenant cookie should not change when navigating to non-tenant collection', async ({
    loginAs,
    getTenantCookie,
    setTenantCookie,
  }) => {
    const page = await loginAs('superAdmin')

    // Set tenant cookie
    await setTenantCookie(page, TenantSlugs.dvac)

    // Visit tenant-scoped collection first to verify cookie is set
    const pagesUrl = new AdminUrlUtil('http://localhost:3000', CollectionSlugs.pages)
    await page.goto(pagesUrl.list)
    await page.waitForLoadState('networkidle')

    const cookieBeforeNonTenant = await getTenantCookie(page)
    expect(cookieBeforeNonTenant).toBe(TenantSlugs.dvac)

    // Navigate to non-tenant collection
    const usersUrl = new AdminUrlUtil('http://localhost:3000', CollectionSlugs.users)
    await page.goto(usersUrl.list)
    await page.waitForLoadState('networkidle')

    // Cookie should still be the same
    const cookieAfterNonTenant = await getTenantCookie(page)
    expect(cookieAfterNonTenant).toBe(TenantSlugs.dvac)

    // Navigate back to tenant-scoped collection
    await page.goto(pagesUrl.list)
    await page.waitForLoadState('networkidle')

    // Cookie should still be preserved
    const cookieAfterBack = await getTenantCookie(page)
    expect(cookieAfterBack).toBe(TenantSlugs.dvac)

    await page.context().close()
  })
})
