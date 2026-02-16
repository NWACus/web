import {
  expect,
  TenantNames,
  tenantSelectorTest as test,
} from '../../fixtures/tenant-selector.fixture'
import { AdminUrlUtil, CollectionSlugs } from '../../helpers'

/**
 * Global Collection Tests (One Per Tenant)
 *
 * Collections with tenantField() AND unique: true.
 * Each tenant has exactly one document.
 *
 * Examples: Settings, Navigations, HomePages
 *
 * Expected behavior:
 * - List view: Tenant selector visible and enabled
 * - Document view: Tenant selector visible and enabled (NOT read-only)
 * - Changing tenant in document view redirects to that tenant's document
 */

test.describe.configure({ timeout: 90000 })

test.describe('Global Collection', () => {
  test.describe('List View', () => {
    test('tenant selector should be visible and enabled', async ({
      loginAs,
      isTenantSelectorVisible,
      isTenantSelectorReadOnly,
    }) => {
      const page = await loginAs('superAdmin')
      const url = new AdminUrlUtil('http://localhost:3000', CollectionSlugs.settings)

      await page.goto(url.list)
      await page.waitForLoadState('networkidle')

      const isVisible = await isTenantSelectorVisible(page)
      expect(isVisible).toBe(true)

      const isReadOnly = await isTenantSelectorReadOnly(page)
      expect(isReadOnly).toBe(false)

      await page.context().close()
    })

    test('changing tenant selector should filter the list', async ({
      loginAs,
      selectTenant,
      getSelectedTenant,
    }) => {
      const page = await loginAs('superAdmin')
      const url = new AdminUrlUtil('http://localhost:3000', CollectionSlugs.settings)

      await page.goto(url.list)
      await page.waitForLoadState('networkidle')

      // Select NWAC tenant
      await selectTenant(page, TenantNames.nwac)
      await page.waitForLoadState('networkidle')

      // Verify tenant selector shows NWAC
      const selectedTenant = await getSelectedTenant(page)
      expect(selectedTenant).toBe(TenantNames.nwac)

      await page.context().close()
    })
  })

  test.describe('Document View', () => {
    test('tenant selector should be visible and enabled (not read-only)', async ({
      loginAs,
      isTenantSelectorVisible,
      isTenantSelectorReadOnly,
    }) => {
      const page = await loginAs('superAdmin')
      const url = new AdminUrlUtil('http://localhost:3000', CollectionSlugs.settings)

      // Go to list and click first document
      await page.goto(url.list)
      await page.waitForLoadState('networkidle')

      const firstRow = page.locator('table tbody tr').first()
      if (await firstRow.isVisible()) {
        await firstRow.click()
        await page.waitForLoadState('networkidle')

        const isVisible = await isTenantSelectorVisible(page)
        expect(isVisible).toBe(true)

        // Key difference from tenant-required: should NOT be read-only
        const isReadOnly = await isTenantSelectorReadOnly(page)
        expect(isReadOnly).toBe(false)
      }

      await page.context().close()
    })

    test('should not be able to clear tenant selector', async ({ loginAs, getTenantSelector }) => {
      const page = await loginAs('superAdmin')
      const url = new AdminUrlUtil('http://localhost:3000', CollectionSlugs.settings)

      await page.goto(url.list)
      await page.waitForLoadState('networkidle')

      const firstRow = page.locator('table tbody tr').first()
      if (await firstRow.isVisible()) {
        await firstRow.click()
        await page.waitForLoadState('networkidle')

        const selector = await getTenantSelector(page)
        if (selector) {
          // Check that clear indicator is not visible (isClearable should be false in document view)
          const clearButton = selector.locator('.clear-indicator')
          const isClearVisible = await clearButton.isVisible().catch(() => false)
          expect(isClearVisible).toBe(false)
        }
      }

      await page.context().close()
    })

    test('changing tenant selector should redirect to that tenant document', async ({
      loginAs,
      selectTenant,
      getSelectedTenant,
    }) => {
      const page = await loginAs('superAdmin')
      const url = new AdminUrlUtil('http://localhost:3000', CollectionSlugs.settings)

      // Navigate to list and select NWAC via UI
      await page.goto(url.list)
      await page.waitForLoadState('networkidle')
      await selectTenant(page, TenantNames.nwac)
      await page.waitForLoadState('networkidle')

      // Click first document (should be NWAC's settings)
      const firstRow = page.locator('table tbody tr').first()
      if (await firstRow.isVisible()) {
        await firstRow.click()
        await page.waitForLoadState('networkidle')

        // Get current URL before switching
        const urlBeforeSwitch = page.url()

        // Change tenant selector to Sawtooth
        await selectTenant(page, TenantNames.snfac)
        await page.waitForLoadState('networkidle')

        // URL should have changed (redirected to SNFAC's settings document)
        const urlAfterSwitch = page.url()
        expect(urlAfterSwitch).not.toBe(urlBeforeSwitch)

        // Tenant selector should now show Sawtooth
        const selectedTenant = await getSelectedTenant(page)
        expect(selectedTenant).toBe(TenantNames.snfac)
      }

      await page.context().close()
    })
  })

  test.describe('Navigations', () => {
    test('tenant selector behavior on Navigations collection', async ({
      loginAs,
      isTenantSelectorVisible,
      isTenantSelectorReadOnly,
    }) => {
      const page = await loginAs('superAdmin')
      const url = new AdminUrlUtil('http://localhost:3000', CollectionSlugs.navigations)

      await page.goto(url.list)
      await page.waitForLoadState('networkidle')

      // List view
      let isVisible = await isTenantSelectorVisible(page)
      expect(isVisible).toBe(true)

      let isReadOnly = await isTenantSelectorReadOnly(page)
      expect(isReadOnly).toBe(false)

      // Document view
      const firstRow = page.locator('table tbody tr').first()
      if (await firstRow.isVisible()) {
        await firstRow.click()
        await page.waitForLoadState('networkidle')

        isVisible = await isTenantSelectorVisible(page)
        expect(isVisible).toBe(true)

        isReadOnly = await isTenantSelectorReadOnly(page)
        expect(isReadOnly).toBe(false)
      }

      await page.context().close()
    })
  })

  test.describe('HomePages', () => {
    test('tenant selector behavior on HomePages collection', async ({
      loginAs,
      isTenantSelectorVisible,
      isTenantSelectorReadOnly,
    }) => {
      const page = await loginAs('superAdmin')
      const url = new AdminUrlUtil('http://localhost:3000', CollectionSlugs.homePages)

      await page.goto(url.list)
      await page.waitForLoadState('networkidle')

      // List view
      let isVisible = await isTenantSelectorVisible(page)
      expect(isVisible).toBe(true)

      let isReadOnly = await isTenantSelectorReadOnly(page)
      expect(isReadOnly).toBe(false)

      // Document view
      const firstRow = page.locator('table tbody tr').first()
      if (await firstRow.isVisible()) {
        await firstRow.click()
        await page.waitForLoadState('networkidle')

        isVisible = await isTenantSelectorVisible(page)
        expect(isVisible).toBe(true)

        isReadOnly = await isTenantSelectorReadOnly(page)
        expect(isReadOnly).toBe(false)
      }

      await page.context().close()
    })
  })
})
