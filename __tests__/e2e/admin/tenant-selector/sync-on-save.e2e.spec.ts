import {
  VALID_TENANT_SLUGS,
  type ValidTenantSlug,
} from '../../../../src/utilities/tenancy/avalancheCenters'
import { openNav } from '../../fixtures/nav.fixture'
import { expect, tenantSelectorTest as test } from '../../fixtures/tenant-selector.fixture'
import { AdminUrlUtil, CollectionSlugs, saveDocAndAssert, waitForFormReady } from '../../helpers'

/**
 * Sync on Save Tests
 *
 * Tests that the tenant selector dropdown refreshes automatically when a
 * tenant is saved (created or updated), without requiring a page reload.
 *
 * The SyncTenantsOnSave component watches useDocumentInfo().lastUpdateTime
 * and calls syncTenants() when it changes.
 *
 * Each test is self-contained: creates its own tenant and cleans up in finally.
 */

const TEMP_TENANT_NAME = 'E2E Sync Test Center'
const UPDATED_TENANT_NAME = 'E2E Sync Test Renamed'

test.describe.configure({ timeout: 90000, mode: 'serial' })

/** Find the first valid tenant slug that doesn't already exist in the database */
async function findUnusedTenantSlug(
  page: import('@playwright/test').Page,
): Promise<ValidTenantSlug> {
  const response = await page.request.get('http://localhost:3000/api/tenants?limit=100')
  const data = await response.json()
  const usedSlugs = new Set(data.docs?.map((doc: { slug: string }) => doc.slug))

  const unused = VALID_TENANT_SLUGS.find((slug) => !usedSlugs.has(slug))
  if (!unused) {
    throw new Error('No unused tenant slugs available')
  }
  return unused
}

/** Delete all tenants matching a slug */
async function deleteTenantBySlug(page: import('@playwright/test').Page, slug: string) {
  const response = await page.request.get(
    `http://localhost:3000/api/tenants?where[slug][equals]=${slug}&limit=100`,
  )
  const data = await response.json()
  for (const doc of data.docs ?? []) {
    await page.request.delete(`http://localhost:3000/api/tenants/${doc.id}`)
  }
}

/** Delete all tenants matching a name (cleanup from previous failed runs) */
async function deleteTenantsByName(page: import('@playwright/test').Page, name: string) {
  const response = await page.request.get(
    `http://localhost:3000/api/tenants?where[name][like]=${encodeURIComponent(name)}&limit=100`,
  )
  const data = await response.json()
  for (const doc of data.docs ?? []) {
    await page.request.delete(`http://localhost:3000/api/tenants/${doc.id}`)
  }
}

/** Create a tenant via the admin UI and return its slug */
async function createTenant(
  page: import('@playwright/test').Page,
  name: string,
): Promise<ValidTenantSlug> {
  const tenantsUrl = new AdminUrlUtil('http://localhost:3000', CollectionSlugs.tenants)
  const slug = await findUnusedTenantSlug(page)

  await page.goto(tenantsUrl.create)
  await page.waitForLoadState('networkidle')
  await waitForFormReady(page)

  await page.locator('#field-name').fill(name)
  const slugField = page.locator('#field-slug')
  await slugField.locator('button.dropdown-indicator').click()
  await slugField.locator('.rs__option', { hasText: new RegExp(`\\(${slug}\\)`) }).click()
  await saveDocAndAssert(page)

  return slug
}

test.describe('Tenant selector syncs on save', () => {
  test('should show new tenant in selector after creation', async ({
    loginAs,
    getTenantOptions,
  }) => {
    const page = await loginAs('superAdmin')
    let slug: ValidTenantSlug | undefined

    // Clean up any leftover tenants from previous failed runs
    await deleteTenantsByName(page, 'E2E Sync Test')

    try {
      slug = await createTenant(page, TEMP_TENANT_NAME)

      // Before save: checklist should show labels but no counts or instructions
      const heading = page.getByText('Onboarding Checklist', { exact: true })
      await expect(heading).toBeVisible({ timeout: 10000 })
      const checklist = page.locator('.rounded-lg', { has: heading })

      // Wait for provisioning to complete — counts should appear
      await expect(checklist.getByText(/\(\d+\/\d+\)/).first()).toBeVisible({ timeout: 30000 })

      // Settings link should be present after provisioning
      await expect(checklist.getByText('Update Brand Assets')).toBeVisible({ timeout: 5000 })

      // Manual theme items should show instructions (new tenant has no colors configured)
      await expect(checklist.getByText('colors.css')).toBeVisible()
      await expect(checklist.getByText('centerColorMap')).toBeVisible()

      // Navigate to a tenant-scoped collection via client-side nav link (NOT page.goto)
      await openNav(page)
      await Promise.all([
        page.waitForURL('**/admin/collections/pages'),
        page.locator('nav a[href="/admin/collections/pages"]').click(),
      ])
      await page.waitForLoadState('domcontentloaded')

      // The tenant selector should show the new tenant without a full page reload
      const options = await getTenantOptions(page)
      expect(options).toContain(TEMP_TENANT_NAME)
    } finally {
      if (slug) await deleteTenantBySlug(page, slug)
      await page.context().close()
    }
  })

  test('should update tenant name in selector after editing', async ({
    loginAs,
    getTenantOptions,
  }) => {
    const page = await loginAs('superAdmin')
    let slug: ValidTenantSlug | undefined

    // Clean up any leftover tenants from previous failed runs
    await deleteTenantsByName(page, 'E2E Sync Test')

    try {
      // Create a fresh tenant for this test
      slug = await createTenant(page, TEMP_TENANT_NAME)

      // We're already on the edit page after creation — rename the tenant
      await waitForFormReady(page)
      await page.locator('#field-name').fill(UPDATED_TENANT_NAME)
      await saveDocAndAssert(page)

      // Navigate to a tenant-scoped collection via client-side nav link (NOT page.goto)
      await openNav(page)
      await Promise.all([
        page.waitForURL('**/admin/collections/pages'),
        page.locator('nav a[href="/admin/collections/pages"]').click(),
      ])
      await page.waitForLoadState('domcontentloaded')

      const options = await getTenantOptions(page)
      expect(options).toContain(UPDATED_TENANT_NAME)
      // FIXME
      // expect(options).not.toContain(TEMP_TENANT_NAME)
    } finally {
      if (slug) await deleteTenantBySlug(page, slug)
      await page.context().close()
    }
  })
})
