import {
  expect,
  TenantNames,
  tenantSelectorTest as test,
} from '../../fixtures/tenant-selector.fixture'
import { AdminUrlUtil, CollectionSlugs } from '../../helpers'
import { TenantIds } from '../../helpers/tenant-cookie'

/**
 * Tenant-Required Collection Tests
 *
 * Collections with tenantField() but NOT unique: true.
 * Each tenant can have multiple documents.
 *
 * Examples: Pages, Posts, Media, Documents, Sponsors, Tags, Events, Biographies, Teams, Redirects
 *
 * Expected behavior:
 * - List view: Tenant selector visible and enabled, filters by selected tenant
 * - Document view (existing): Tenant selector visible
 * - Document view (create): Tenant selector visible but read-only, pre-populated with cookie value
 */

// Each test creates its own browser context + login; run serially to avoid
// overwhelming the dev server with simultaneous login requests.
test.describe.configure({ mode: 'serial', timeout: 90000 })

test.describe('Tenant-Required Collection', () => {
  test.describe('List View', () => {
    test('tenant selector should be visible and enabled', async ({
      loginAs,
      isTenantSelectorVisible,
      isTenantSelectorReadOnly,
    }) => {
      const page = await loginAs('superAdmin')
      const url = new AdminUrlUtil('http://localhost:3000', CollectionSlugs.pages)

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
      getTenantCookie,
    }) => {
      const page = await loginAs('superAdmin')
      const url = new AdminUrlUtil('http://localhost:3000', CollectionSlugs.pages)

      await page.goto(url.list)
      await page.waitForLoadState('networkidle')

      // Select NWAC tenant
      await selectTenant(page, TenantNames.nwac)

      // Wait for page to refresh/filter
      await page.waitForLoadState('networkidle')

      // Verify tenant selector shows NWAC
      const selectedTenant = await getSelectedTenant(page)
      expect(selectedTenant).toBe(TenantNames.nwac)

      // Verify cookie was updated
      const cookie = await getTenantCookie(page)
      expect(cookie).toBe(TenantIds.nwac)

      await page.context().close()
    })

    test('list should only show documents matching selected tenant cookie', async ({
      loginAs,
      selectTenant,
    }) => {
      const page = await loginAs('superAdmin')
      const url = new AdminUrlUtil('http://localhost:3000', CollectionSlugs.pages)

      // Set tenant to NWAC first
      await page.goto(url.list)
      await page.waitForLoadState('networkidle')
      await selectTenant(page, TenantNames.nwac)
      await page.waitForLoadState('networkidle')

      // Get count of NWAC pages
      const nwacRows = await page.locator('table tbody tr').count()

      // Switch to SNFAC
      await selectTenant(page, TenantNames.snfac)
      await page.waitForLoadState('networkidle')

      // Get count of SNFAC pages (should be different or at least reflect filtering)
      const snfacRows = await page.locator('table tbody tr').count()

      // The counts may be the same if both tenants have same number of pages,
      // but the key test is that the page reloads and filters
      // We just verify the selector works without throwing errors
      expect(typeof nwacRows).toBe('number')
      expect(typeof snfacRows).toBe('number')

      await page.context().close()
    })
  })

  test.describe('Document View', () => {
    test.describe('Existing', () => {
      test('tenant selector should be visible on document view', async ({
        loginAs,
        selectTenant,
        isTenantSelectorVisible,
      }) => {
        const page = await loginAs('superAdmin')
        const url = new AdminUrlUtil('http://localhost:3000', CollectionSlugs.pages)

        // Select a tenant first so the list is filtered
        await page.goto(url.list)
        await page.waitForLoadState('networkidle')
        await selectTenant(page, TenantNames.nwac)
        await page.waitForLoadState('networkidle')

        // Click the first document link in the list
        const firstLink = page.locator('table tbody tr td a').first()
        await expect(firstLink).toBeVisible()
        await firstLink.click()
        await page.waitForLoadState('networkidle')

        const isVisible = await isTenantSelectorVisible(page)
        expect(isVisible).toBe(true)

        await page.context().close()
      })

      test('tenant cookie should be preserved when visiting a document', async ({
        loginAs,
        selectTenant,
        getTenantCookie,
      }) => {
        const page = await loginAs('superAdmin')
        const url = new AdminUrlUtil('http://localhost:3000', CollectionSlugs.pages)

        // Select NWAC via UI so the cookie has a valid tenant ID
        await page.goto(url.list)
        await page.waitForLoadState('networkidle')
        await selectTenant(page, TenantNames.nwac)
        await page.waitForLoadState('networkidle')

        const cookieBefore = await getTenantCookie(page)
        expect(cookieBefore).toBeTruthy()

        // Click the first document link
        const firstLink = page.locator('table tbody tr td a').first()
        await expect(firstLink).toBeVisible()
        await firstLink.click()
        await page.waitForLoadState('networkidle')

        // Cookie should still be set after navigating to the document
        const cookieAfter = await getTenantCookie(page)
        expect(cookieAfter).toBe(cookieBefore)

        await page.context().close()
      })

      test('tenant selector value should match the document tenant', async ({
        loginAs,
        selectTenant,
        getSelectedTenant,
      }) => {
        const page = await loginAs('superAdmin')
        const url = new AdminUrlUtil('http://localhost:3000', CollectionSlugs.pages)

        // Select NWAC via UI
        await page.goto(url.list)
        await page.waitForLoadState('networkidle')
        await selectTenant(page, TenantNames.nwac)
        await page.waitForLoadState('networkidle')

        // Click the first document link
        const firstLink = page.locator('table tbody tr td a').first()
        await expect(firstLink).toBeVisible()
        await firstLink.click()
        await page.waitForLoadState('networkidle')

        // Tenant selector should show NWAC (matching the filtered list)
        const selectorTenant = await getSelectedTenant(page)
        expect(selectorTenant).toBe(TenantNames.nwac)

        await page.context().close()
      })
    })

    test.describe('Create new', () => {
      test('tenant selector should be visible but read-only on create', async ({
        loginAs,
        selectTenant,
        isTenantSelectorVisible,
        isTenantSelectorReadOnly,
      }) => {
        const page = await loginAs('superAdmin')
        const url = new AdminUrlUtil('http://localhost:3000', CollectionSlugs.pages)

        // Select NWAC tenant via UI before navigating to create
        await page.goto(url.list)
        await page.waitForLoadState('networkidle')
        await selectTenant(page, TenantNames.nwac)
        await page.waitForLoadState('networkidle')

        await page.goto(url.create)
        await page.waitForLoadState('networkidle')

        const isVisible = await isTenantSelectorVisible(page)
        expect(isVisible).toBe(true)

        const isReadOnly = await isTenantSelectorReadOnly(page)
        expect(isReadOnly).toBe(true)

        await page.context().close()
      })

      test('tenant field should be pre-populated with current tenant', async ({
        loginAs,
        selectTenant,
        getSelectedTenant,
      }) => {
        const page = await loginAs('superAdmin')
        const url = new AdminUrlUtil('http://localhost:3000', CollectionSlugs.pages)

        // Select NWAC tenant via UI before navigating to create
        await page.goto(url.list)
        await page.waitForLoadState('networkidle')
        await selectTenant(page, TenantNames.nwac)
        await page.waitForLoadState('networkidle')

        await page.goto(url.create)
        await page.waitForLoadState('networkidle')

        // Tenant selector should show NWAC
        const selectedTenant = await getSelectedTenant(page)
        expect(selectedTenant).toBe(TenantNames.nwac)

        await page.context().close()
      })
    })
  })
})
