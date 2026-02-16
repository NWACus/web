import { TenantIds } from '__tests__/e2e/helpers/tenant-cookie'
import {
  expect,
  TenantNames,
  TenantSlugs,
  tenantSelectorTest as test,
} from '../../fixtures/tenant-selector.fixture'
import { AdminUrlUtil, CollectionSlugs } from '../../helpers'

/**
 * Tenant Cookie Edge Cases
 *
 * Tests for edge cases in tenant cookie handling:
 * - No cookie initially
 * - Invalid cookie value
 * - Cookie persistence
 * - Cookie cleared manually
 */

test.describe.configure({ timeout: 60000 })

test.describe('Tenant Cookie Edge Cases', () => {
  test('no cookie initially - page loads without crashing', async ({
    loginAs,
    setTenantCookie,
    isTenantSelectorVisible,
  }) => {
    const page = await loginAs('superAdmin')
    const url = new AdminUrlUtil('http://localhost:3000', CollectionSlugs.pages)

    // Clear only the tenant cookie (keep auth session intact)
    await setTenantCookie(page, undefined)

    // Navigate to a tenant-required collection
    await page.goto(url.list)
    await page.waitForLoadState('networkidle')

    // Page should load without crashing and show the collection list
    await expect(page.locator('table')).toBeVisible({ timeout: 10000 })

    // Tenant selector should still be visible in nav
    const isVisible = await isTenantSelectorVisible(page)
    expect(isVisible).toBe(true)

    await page.context().close()
  })

  test('invalid cookie value - page handles gracefully without crashing', async ({
    loginAs,
    getTenantCookie,
    isTenantSelectorVisible,
  }) => {
    const page = await loginAs('superAdmin')

    // Set an invalid tenant cookie
    await page.context().addCookies([
      {
        name: 'payload-tenant',
        value: 'non-existent-tenant-slug',
        domain: 'localhost',
        path: '/',
      },
    ])

    const url = new AdminUrlUtil('http://localhost:3000', CollectionSlugs.pages)
    await page.goto(url.list)
    await page.waitForLoadState('networkidle')

    // Page should load without crashing
    await expect(page.locator('table')).toBeVisible({ timeout: 10000 })

    // Tenant selector should still be visible
    const isVisible = await isTenantSelectorVisible(page)
    expect(isVisible).toBe(true)

    // Cookie should either be cleared or remain as-is (app doesn't auto-correct it)
    const cookie = await getTenantCookie(page)
    const validSlugs: string[] = Object.values(TenantSlugs)
    expect(
      cookie === undefined || cookie === 'non-existent-tenant-slug' || validSlugs.includes(cookie),
    ).toBe(true)

    await page.context().close()
  })

  test('cookie should persist across page navigation', async ({
    loginAs,
    selectTenant,
    getTenantCookie,
    getSelectedTenant,
  }) => {
    const page = await loginAs('superAdmin')
    const pagesUrl = new AdminUrlUtil('http://localhost:3000', CollectionSlugs.pages)
    const postsUrl = new AdminUrlUtil('http://localhost:3000', CollectionSlugs.posts)

    // Set tenant to DVAC
    await page.goto(pagesUrl.list)
    await page.waitForLoadState('networkidle')
    await selectTenant(page, TenantNames.dvac)
    await page.waitForLoadState('networkidle')

    // Cookie should be set after selecting a tenant (stores tenant ID, not slug)
    const cookieAfterSelect = await getTenantCookie(page)
    expect(cookieAfterSelect).toBeTruthy()

    // Navigate to another collection
    await page.goto(postsUrl.list)
    await page.waitForLoadState('networkidle')

    // Cookie should persist with the same value
    const cookieAfterNav = await getTenantCookie(page)
    expect(cookieAfterNav).toBe(cookieAfterSelect)

    // Selector should still show DVAC
    const selected = await getSelectedTenant(page)
    expect(selected).toBe(TenantNames.dvac)

    await page.context().close()
  })

  test('cookie cleared manually - page loads without crashing', async ({
    loginAs,
    selectTenant,
    getTenantCookie,
    setTenantCookie,
  }) => {
    const page = await loginAs('superAdmin')
    const url = new AdminUrlUtil('http://localhost:3000', CollectionSlugs.pages)

    // Select a tenant via UI (sets cookie to tenant ID)
    await page.goto(url.list)
    await page.waitForLoadState('networkidle')
    await selectTenant(page, TenantNames.snfac)
    await page.waitForLoadState('networkidle')

    const cookie = await getTenantCookie(page)
    expect(cookie).toBeTruthy()

    // Clear the cookie
    await setTenantCookie(page, undefined)

    // Navigate to admin again - page should load without crashing
    await page.goto(url.list)
    await page.waitForLoadState('networkidle')

    await expect(page.locator('table')).toBeVisible({ timeout: 10000 })

    await page.context().close()
  })
})

test.describe('Navigation & State Consistency', () => {
  test('direct URL access should preserve tenant cookie from document', async ({
    loginAs,
    selectTenant,
    getTenantCookie,
  }) => {
    const page = await loginAs('superAdmin')
    const url = new AdminUrlUtil('http://localhost:3000', CollectionSlugs.pages)

    // Select a tenant via UI
    await page.goto(url.list)
    await page.waitForLoadState('networkidle')
    await selectTenant(page, TenantNames.nwac)
    await page.waitForLoadState('networkidle')

    const firstRow = page.locator('table tbody tr').first()
    if (await firstRow.isVisible()) {
      await firstRow.click()
      await page.waitForLoadState('networkidle')

      // Get the cookie while viewing the document
      const docTenantCookie = await getTenantCookie(page)
      expect(docTenantCookie).toBe(TenantIds.nwac)

      // Navigate away and back using browser history
      await page.goBack()
      await page.waitForLoadState('networkidle')
      await page.goForward()
      await page.waitForLoadState('networkidle')

      // Cookie should still be the same
      const cookieAfterReturn = await getTenantCookie(page)
      expect(cookieAfterReturn).toBe(docTenantCookie)
    }

    await page.context().close()
  })

  test('cross-collection navigation should show/hide selector appropriately', async ({
    loginAs,
    isTenantSelectorVisible,
  }) => {
    const page = await loginAs('superAdmin')

    // Start at tenant-required collection
    const pagesUrl = new AdminUrlUtil('http://localhost:3000', CollectionSlugs.pages)
    await page.goto(pagesUrl.list)
    await page.waitForLoadState('networkidle')

    let isVisible = await isTenantSelectorVisible(page)
    expect(isVisible).toBe(true)

    // Navigate to non-tenant collection
    const usersUrl = new AdminUrlUtil('http://localhost:3000', CollectionSlugs.users)
    await page.goto(usersUrl.list)
    await page.waitForLoadState('networkidle')

    isVisible = await isTenantSelectorVisible(page)
    expect(isVisible).toBe(false)

    // Navigate back to tenant collection
    await page.goto(pagesUrl.list)
    await page.waitForLoadState('networkidle')

    isVisible = await isTenantSelectorVisible(page)
    expect(isVisible).toBe(true)

    await page.context().close()
  })
})

test.describe('Dashboard View', () => {
  test('tenant selector should be visible and enabled on dashboard', async ({
    loginAs,
    isTenantSelectorVisible,
    isTenantSelectorReadOnly,
  }) => {
    const page = await loginAs('superAdmin')

    await page.goto('/admin')
    await page.waitForLoadState('networkidle')

    const isVisible = await isTenantSelectorVisible(page)
    expect(isVisible).toBe(true)

    const isReadOnly = await isTenantSelectorReadOnly(page)
    expect(isReadOnly).toBe(false)

    await page.context().close()
  })

  test('changing tenant selector on dashboard should update cookie', async ({
    loginAs,
    selectTenant,
    getTenantCookie,
  }) => {
    const page = await loginAs('superAdmin')

    await page.goto('/admin')
    await page.waitForLoadState('networkidle')

    // Select Sawtooth Avalanche Center
    await selectTenant(page, TenantNames.snfac)
    await page.waitForLoadState('networkidle')

    // Cookie should be set after selecting a tenant (stores tenant ID, not slug)
    const cookie = await getTenantCookie(page)
    expect(cookie).toBe(TenantIds.snfac)

    await page.context().close()
  })

  test('dashboard should be hidden for single-tenant user', async ({
    loginAs,
    isTenantSelectorVisible,
  }) => {
    const page = await loginAs('singleTenantAdmin')

    await page.goto('/admin')
    await page.waitForLoadState('networkidle')

    // Single-tenant user shouldn't see the selector
    const isVisible = await isTenantSelectorVisible(page)
    expect(isVisible).toBe(false)

    await page.context().close()
  })
})
