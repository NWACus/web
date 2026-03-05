import { expect, tenantSelectorTest as test } from '../../fixtures/tenant-selector.fixture'
import { AdminUrlUtil, CollectionSlugs } from '../../helpers'

/**
 * Dashboard Tests
 *
 * Tests that the tenant selector is visible and functional on the admin dashboard.
 * Previously, the selector was hidden on the dashboard because viewType was never
 * set to 'dashboard'. Fixed by detecting dashboard from URL params instead.
 *
 * Related: https://github.com/NWACus/web/issues/691
 */

test.describe.configure({ timeout: 90000 })

test.describe('Tenant selector on dashboard', () => {
  test('should be visible on the dashboard for super admin', async ({
    loginAs,
    isTenantSelectorVisible,
    getTenantOptions,
  }) => {
    const page = await loginAs('superAdmin')
    const url = new AdminUrlUtil('http://localhost:3000', CollectionSlugs.pages)

    await page.goto(url.dashboard)
    await page.waitForLoadState('networkidle')

    const isVisible = await isTenantSelectorVisible(page)
    expect(isVisible).toBe(true)

    const options = await getTenantOptions(page)
    expect(options.length).toBeGreaterThanOrEqual(4)

    await page.context().close()
  })

  test('should be visible on the dashboard for multi-tenant admin', async ({
    loginAs,
    isTenantSelectorVisible,
    getTenantOptions,
  }) => {
    const page = await loginAs('multiTenantAdmin')
    const url = new AdminUrlUtil('http://localhost:3000', CollectionSlugs.pages)

    await page.goto(url.dashboard)
    await page.waitForLoadState('networkidle')

    const isVisible = await isTenantSelectorVisible(page)
    expect(isVisible).toBe(true)

    const options = await getTenantOptions(page)
    expect(options.length).toBe(2) // NWAC and SNFAC

    await page.context().close()
  })

  test('should be hidden on dashboard for single-tenant users', async ({
    loginAs,
    isTenantSelectorVisible,
  }) => {
    const page = await loginAs('singleTenantAdmin')
    const url = new AdminUrlUtil('http://localhost:3000', CollectionSlugs.pages)

    await page.goto(url.dashboard)
    await page.waitForLoadState('networkidle')

    // Single-tenant users have only 1 option, so selector is hidden
    const isVisible = await isTenantSelectorVisible(page)
    expect(isVisible).toBe(false)

    await page.context().close()
  })
})
