import {
  expect,
  TenantSlugs,
  tenantSelectorTest as test,
} from '../../fixtures/tenant-selector.fixture'
import { AdminUrlUtil, CollectionSlugs } from '../../helpers'

/**
 * Cookie Edge Cases
 *
 * Tests for edge cases in tenant cookie handling:
 * - No cookie initially
 * - Invalid cookie value
 * - Cookie persistence
 * - Cookie cleared manually
 */

test.describe('Cookie Edge Cases', () => {
  test('no cookie initially - should auto-select first available tenant', async ({
    loginAs,
    getTenantCookie,
    getSelectedTenant,
  }) => {
    const page = await loginAs('superAdmin')
    const url = new AdminUrlUtil('http://localhost:3000', CollectionSlugs.pages)

    // Clear any existing cookie
    await page.context().clearCookies()

    // Re-login after clearing cookies
    await page.goto('/admin/logout')
    await page.goto('/admin')
    await page.fill('input[name="email"]', 'admin@avy.com')
    await page.fill('input[name="password"]', 'localpass')
    await page.click('button[type="submit"]')
    await expect(page.locator('.dashboard')).toBeVisible({ timeout: 10000 })

    await page.goto(url.list)
    await page.waitForLoadState('networkidle')

    // Cookie should now be set to some tenant
    const cookie = await getTenantCookie(page)
    expect(cookie).toBeTruthy()

    // Tenant selector should show a selected value
    const selected = await getSelectedTenant(page)
    expect(selected).toBeTruthy()

    await page.context().close()
  })

  test('invalid cookie value - should fallback to first available tenant', async ({
    loginAs,
    getTenantCookie,
    getSelectedTenant,
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

    // System should handle gracefully - either reset cookie or show first tenant
    const cookie = await getTenantCookie(page)
    const selected = await getSelectedTenant(page)

    // Either the cookie was reset to a valid tenant, or selector shows first available
    // The key is that it doesn't crash and shows a valid selection
    expect(selected).toBeTruthy()
    // Cookie should either be cleared or set to a valid tenant
    expect(cookie === undefined || Object.values(TenantSlugs).includes(cookie as never)).toBe(true)

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
    await selectTenant(page, 'DVAC')
    await page.waitForLoadState('networkidle')

    const cookieAfterSelect = await getTenantCookie(page)
    expect(cookieAfterSelect).toBe(TenantSlugs.dvac)

    // Navigate to another collection
    await page.goto(postsUrl.list)
    await page.waitForLoadState('networkidle')

    // Cookie should still be DVAC
    const cookieAfterNav = await getTenantCookie(page)
    expect(cookieAfterNav).toBe(TenantSlugs.dvac)

    // Selector should still show DVAC
    const selected = await getSelectedTenant(page)
    expect(selected).toBe('DVAC')

    await page.context().close()
  })

  test('cookie cleared manually - visiting admin should auto-select first tenant', async ({
    loginAs,
    getTenantCookie,
    setTenantCookie,
  }) => {
    const page = await loginAs('superAdmin')
    const url = new AdminUrlUtil('http://localhost:3000', CollectionSlugs.pages)

    // First set a valid cookie
    await setTenantCookie(page, TenantSlugs.snfac)
    await page.goto(url.list)
    await page.waitForLoadState('networkidle')

    let cookie = await getTenantCookie(page)
    expect(cookie).toBe(TenantSlugs.snfac)

    // Clear the cookie
    await setTenantCookie(page, undefined)

    // Navigate to admin again
    await page.goto(url.list)
    await page.waitForLoadState('networkidle')

    // Cookie should be auto-set to some tenant
    cookie = await getTenantCookie(page)
    expect(cookie).toBeTruthy()

    await page.context().close()
  })
})

test.describe('Navigation & State Consistency', () => {
  test('direct URL access should set correct tenant from document', async ({
    loginAs,
    getTenantCookie,
    setTenantCookie,
  }) => {
    const page = await loginAs('superAdmin')
    const url = new AdminUrlUtil('http://localhost:3000', CollectionSlugs.pages)

    // Set to one tenant
    await setTenantCookie(page, TenantSlugs.nwac)

    // Go to list to get a document ID
    await page.goto(url.list)
    await page.waitForLoadState('networkidle')

    const firstRow = page.locator('table tbody tr').first()
    if (await firstRow.isVisible()) {
      await firstRow.click()
      await page.waitForLoadState('networkidle')

      // Get the document's tenant from cookie (it should be set by visiting the doc)
      const docTenantCookie = await getTenantCookie(page)

      // Navigate away
      await page.goto(url.list)
      await page.waitForLoadState('networkidle')

      // Change to different tenant
      await setTenantCookie(page, TenantSlugs.dvac)

      // Go back to the document URL (use browser history)
      await page.goBack()
      await page.waitForLoadState('networkidle')

      // Cookie should be set to document's tenant
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

    // Select SNFAC
    await selectTenant(page, 'SNFAC')
    await page.waitForLoadState('networkidle')

    const cookie = await getTenantCookie(page)
    expect(cookie).toBe(TenantSlugs.snfac)

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
