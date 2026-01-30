import {
  expect,
  TenantSlugs,
  tenantSelectorTest as test,
} from '../../fixtures/tenant-selector.fixture'
import { AdminUrlUtil, CollectionSlugs } from '../../helpers'

/**
 * Role-Based Test Cases
 *
 * Tests tenant selector behavior based on user roles:
 * - Super Admin: sees all tenants
 * - Multi-Center Admin: sees only assigned tenants
 * - Single-Center Admin: tenant selector hidden (only 1 option)
 */

test.describe('Super Admin', () => {
  test('should see all tenants in dropdown', async ({ loginAs, getTenantOptions }) => {
    const page = await loginAs('superAdmin')
    const url = new AdminUrlUtil('http://localhost:3000', CollectionSlugs.pages)

    await page.goto(url.list)
    await page.waitForLoadState('networkidle')

    const options = await getTenantOptions(page)

    // Super admin should see all seeded tenants
    expect(options).toContain('NWAC')
    expect(options).toContain('SNFAC')
    expect(options).toContain('DVAC')
    expect(options).toContain('SAC')
    expect(options.length).toBeGreaterThanOrEqual(4)

    await page.context().close()
  })

  test('should be able to switch between any tenant', async ({
    loginAs,
    selectTenant,
    getSelectedTenant,
  }) => {
    const page = await loginAs('superAdmin')
    const url = new AdminUrlUtil('http://localhost:3000', CollectionSlugs.pages)

    await page.goto(url.list)
    await page.waitForLoadState('networkidle')

    // Switch to NWAC
    await selectTenant(page, 'NWAC')
    await page.waitForLoadState('networkidle')
    let selected = await getSelectedTenant(page)
    expect(selected).toBe('NWAC')

    // Switch to SNFAC
    await selectTenant(page, 'SNFAC')
    await page.waitForLoadState('networkidle')
    selected = await getSelectedTenant(page)
    expect(selected).toBe('SNFAC')

    // Switch to DVAC
    await selectTenant(page, 'DVAC')
    await page.waitForLoadState('networkidle')
    selected = await getSelectedTenant(page)
    expect(selected).toBe('DVAC')

    await page.context().close()
  })

  test('should have access to all collections including non-tenant ones', async ({
    loginAs,
    isTenantSelectorVisible,
  }) => {
    const page = await loginAs('superAdmin')

    // Access tenant collection
    const pagesUrl = new AdminUrlUtil('http://localhost:3000', CollectionSlugs.pages)
    await page.goto(pagesUrl.list)
    await page.waitForLoadState('networkidle')
    let isVisible = await isTenantSelectorVisible(page)
    expect(isVisible).toBe(true)

    // Access non-tenant collection
    const usersUrl = new AdminUrlUtil('http://localhost:3000', CollectionSlugs.users)
    await page.goto(usersUrl.list)
    await page.waitForLoadState('networkidle')
    isVisible = await isTenantSelectorVisible(page)
    expect(isVisible).toBe(false)

    // Access global roles (non-tenant)
    const rolesUrl = new AdminUrlUtil('http://localhost:3000', CollectionSlugs.globalRoles)
    await page.goto(rolesUrl.list)
    await page.waitForLoadState('networkidle')
    isVisible = await isTenantSelectorVisible(page)
    expect(isVisible).toBe(false)

    await page.context().close()
  })
})

test.describe('Multi-Center Admin', () => {
  test('should see only assigned tenants in dropdown', async ({ loginAs, getTenantOptions }) => {
    // multiTenantAdmin has access to NWAC and SNFAC only
    const page = await loginAs('multiTenantAdmin')
    const url = new AdminUrlUtil('http://localhost:3000', CollectionSlugs.pages)

    await page.goto(url.list)
    await page.waitForLoadState('networkidle')

    const options = await getTenantOptions(page)

    // Should see NWAC and SNFAC
    expect(options).toContain('NWAC')
    expect(options).toContain('SNFAC')

    // Should NOT see DVAC or SAC
    expect(options).not.toContain('DVAC')
    expect(options).not.toContain('SAC')

    await page.context().close()
  })

  test('should be able to switch between assigned tenants', async ({
    loginAs,
    selectTenant,
    getSelectedTenant,
  }) => {
    const page = await loginAs('multiTenantAdmin')
    const url = new AdminUrlUtil('http://localhost:3000', CollectionSlugs.pages)

    await page.goto(url.list)
    await page.waitForLoadState('networkidle')

    // Switch to NWAC
    await selectTenant(page, 'NWAC')
    await page.waitForLoadState('networkidle')
    let selected = await getSelectedTenant(page)
    expect(selected).toBe('NWAC')

    // Switch to SNFAC
    await selectTenant(page, 'SNFAC')
    await page.waitForLoadState('networkidle')
    selected = await getSelectedTenant(page)
    expect(selected).toBe('SNFAC')

    await page.context().close()
  })
})

test.describe('Single-Center Admin', () => {
  test('tenant selector should be hidden (only 1 option)', async ({
    loginAs,
    isTenantSelectorVisible,
  }) => {
    // singleTenantAdmin has access to NWAC only
    const page = await loginAs('singleTenantAdmin')
    const url = new AdminUrlUtil('http://localhost:3000', CollectionSlugs.pages)

    await page.goto(url.list)
    await page.waitForLoadState('networkidle')

    // Tenant selector should be hidden when user has only 1 tenant
    const isVisible = await isTenantSelectorVisible(page)
    expect(isVisible).toBe(false)

    await page.context().close()
  })

  test('tenant cookie should automatically be set to their single tenant', async ({
    loginAs,
    getTenantCookie,
  }) => {
    const page = await loginAs('singleTenantAdmin')
    const url = new AdminUrlUtil('http://localhost:3000', CollectionSlugs.pages)

    await page.goto(url.list)
    await page.waitForLoadState('networkidle')

    // Cookie should be set to their tenant (nwac)
    const cookie = await getTenantCookie(page)
    expect(cookie).toBe(TenantSlugs.nwac)

    await page.context().close()
  })

  test('all tenant-scoped operations should use their single tenant', async ({
    loginAs,
    getTenantCookie,
  }) => {
    const page = await loginAs('singleTenantAdmin')

    // Visit multiple tenant-scoped collections
    const collectionsToCheck = [CollectionSlugs.pages, CollectionSlugs.posts, CollectionSlugs.media]

    for (const slug of collectionsToCheck) {
      const url = new AdminUrlUtil('http://localhost:3000', slug)
      await page.goto(url.list)
      await page.waitForLoadState('networkidle')

      const cookie = await getTenantCookie(page)
      expect(cookie).toBe(TenantSlugs.nwac)
    }

    await page.context().close()
  })
})

test.describe('Forecaster Role', () => {
  test('tenant selector should be hidden for single-tenant forecaster', async ({
    loginAs,
    isTenantSelectorVisible,
    getTenantCookie,
  }) => {
    // singleTenantForecaster has access to NWAC only
    const page = await loginAs('singleTenantForecaster')
    const url = new AdminUrlUtil('http://localhost:3000', CollectionSlugs.pages)

    await page.goto(url.list)
    await page.waitForLoadState('networkidle')

    // Tenant selector should be hidden (only 1 tenant)
    const isVisible = await isTenantSelectorVisible(page)
    expect(isVisible).toBe(false)

    // Cookie should be set to NWAC
    const cookie = await getTenantCookie(page)
    expect(cookie).toBe(TenantSlugs.nwac)

    await page.context().close()
  })
})

test.describe('Staff Role', () => {
  test('tenant selector should be hidden for single-tenant staff', async ({
    loginAs,
    isTenantSelectorVisible,
    getTenantCookie,
  }) => {
    // singleTenantStaff has access to NWAC only
    const page = await loginAs('singleTenantStaff')
    const url = new AdminUrlUtil('http://localhost:3000', CollectionSlugs.pages)

    await page.goto(url.list)
    await page.waitForLoadState('networkidle')

    // Tenant selector should be hidden (only 1 tenant)
    const isVisible = await isTenantSelectorVisible(page)
    expect(isVisible).toBe(false)

    // Cookie should be set to NWAC
    const cookie = await getTenantCookie(page)
    expect(cookie).toBe(TenantSlugs.nwac)

    await page.context().close()
  })
})
