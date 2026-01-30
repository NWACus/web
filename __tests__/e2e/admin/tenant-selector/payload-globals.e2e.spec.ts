import {
  expect,
  TenantSlugs,
  tenantSelectorTest as test,
} from '../../fixtures/tenant-selector.fixture'
import { AdminUrlUtil, GlobalSlugs } from '../../helpers'

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

test.describe('Payload Global - A3Management', () => {
  test('tenant selector should be hidden', async ({
    loginAs,
    isTenantSelectorVisible,
    getTenantCookie,
    setTenantCookie,
  }) => {
    const page = await loginAs('superAdmin')
    const url = new AdminUrlUtil('http://localhost:3000', '')

    // Set a known tenant cookie before visiting
    await setTenantCookie(page, TenantSlugs.nwac)
    const cookieBefore = await getTenantCookie(page)

    await page.goto(url.global(GlobalSlugs.a3Management))
    await page.waitForLoadState('networkidle')

    // Tenant selector should be hidden
    const isVisible = await isTenantSelectorVisible(page)
    expect(isVisible).toBe(false)

    // Cookie should NOT be changed
    const cookieAfter = await getTenantCookie(page)
    expect(cookieAfter).toBe(cookieBefore)

    await page.context().close()
  })

  test('should be accessible regardless of tenant cookie', async ({ loginAs, setTenantCookie }) => {
    const page = await loginAs('superAdmin')
    const url = new AdminUrlUtil('http://localhost:3000', '')

    // Try with NWAC
    await setTenantCookie(page, TenantSlugs.nwac)
    await page.goto(url.global(GlobalSlugs.a3Management))
    await page.waitForLoadState('networkidle')

    // Should load successfully (check for form elements or header)
    await expect(page.locator('.render-title, .doc-header')).toBeVisible({ timeout: 10000 })

    // Try with SNFAC
    await setTenantCookie(page, TenantSlugs.snfac)
    await page.goto(url.global(GlobalSlugs.a3Management))
    await page.waitForLoadState('networkidle')

    // Should still load successfully
    await expect(page.locator('.render-title, .doc-header')).toBeVisible({ timeout: 10000 })

    await page.context().close()
  })
})

test.describe('Payload Global - NACWidgetsConfig', () => {
  test('tenant selector should be hidden', async ({ loginAs, isTenantSelectorVisible }) => {
    const page = await loginAs('superAdmin')
    const url = new AdminUrlUtil('http://localhost:3000', '')

    await page.goto(url.global(GlobalSlugs.nacWidgetsConfig))
    await page.waitForLoadState('networkidle')

    const isVisible = await isTenantSelectorVisible(page)
    expect(isVisible).toBe(false)

    await page.context().close()
  })

  test('tenant cookie should not change when visiting', async ({
    loginAs,
    getTenantCookie,
    setTenantCookie,
  }) => {
    const page = await loginAs('superAdmin')
    const url = new AdminUrlUtil('http://localhost:3000', '')

    await setTenantCookie(page, TenantSlugs.dvac)
    const cookieBefore = await getTenantCookie(page)

    await page.goto(url.global(GlobalSlugs.nacWidgetsConfig))
    await page.waitForLoadState('networkidle')

    const cookieAfter = await getTenantCookie(page)
    expect(cookieAfter).toBe(cookieBefore)

    await page.context().close()
  })
})

test.describe('Payload Global - Diagnostics', () => {
  test('tenant selector should be hidden', async ({ loginAs, isTenantSelectorVisible }) => {
    const page = await loginAs('superAdmin')
    const url = new AdminUrlUtil('http://localhost:3000', '')

    await page.goto(url.global(GlobalSlugs.diagnostics))
    await page.waitForLoadState('networkidle')

    const isVisible = await isTenantSelectorVisible(page)
    expect(isVisible).toBe(false)

    await page.context().close()
  })

  test('tenant cookie should not change when visiting', async ({
    loginAs,
    getTenantCookie,
    setTenantCookie,
  }) => {
    const page = await loginAs('superAdmin')
    const url = new AdminUrlUtil('http://localhost:3000', '')

    await setTenantCookie(page, TenantSlugs.sac)
    const cookieBefore = await getTenantCookie(page)

    await page.goto(url.global(GlobalSlugs.diagnostics))
    await page.waitForLoadState('networkidle')

    const cookieAfter = await getTenantCookie(page)
    expect(cookieAfter).toBe(cookieBefore)

    await page.context().close()
  })
})

test.describe('Payload Global - Navigation to and from', () => {
  test('navigating from global to collection should preserve tenant cookie', async ({
    loginAs,
    getTenantCookie,
    setTenantCookie,
    isTenantSelectorVisible,
  }) => {
    const page = await loginAs('superAdmin')

    // Set tenant cookie
    await setTenantCookie(page, TenantSlugs.nwac)

    // Visit a global
    const globalUrl = new AdminUrlUtil('http://localhost:3000', '')
    await page.goto(globalUrl.global(GlobalSlugs.a3Management))
    await page.waitForLoadState('networkidle')

    // Selector should be hidden
    let isVisible = await isTenantSelectorVisible(page)
    expect(isVisible).toBe(false)

    // Cookie should still be NWAC
    let cookie = await getTenantCookie(page)
    expect(cookie).toBe(TenantSlugs.nwac)

    // Navigate to a tenant collection
    const pagesUrl = new AdminUrlUtil('http://localhost:3000', 'pages')
    await page.goto(pagesUrl.list)
    await page.waitForLoadState('networkidle')

    // Selector should now be visible
    isVisible = await isTenantSelectorVisible(page)
    expect(isVisible).toBe(true)

    // Cookie should still be NWAC
    cookie = await getTenantCookie(page)
    expect(cookie).toBe(TenantSlugs.nwac)

    await page.context().close()
  })
})
