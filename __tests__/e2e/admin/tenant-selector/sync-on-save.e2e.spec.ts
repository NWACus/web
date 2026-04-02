import { type ValidTenantSlug } from '../../../../src/utilities/tenancy/avalancheCenters'
import { openNav } from '../../fixtures/nav.fixture'
import { expect, tenantSelectorTest as test } from '../../fixtures/tenant-selector.fixture'
import { AdminUrlUtil, CollectionSlugs, saveDocAndAssert, waitForFormReady } from '../../helpers'

/**
 * Sync on Save Tests
 *
 * Tests that the tenant selector dropdown refreshes automatically when a
 * tenant is saved (created or updated), without requiring a page reload.
 *
 * Each test is self-contained: creates its own tenant and cleans up in finally.
 */

const TEMP_TENANT_NAME = 'E2E Sync Test Center'
const UPDATED_TENANT_NAME = 'E2E Sync Test Renamed'

test.describe.configure({ timeout: 120000, mode: 'serial' })

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

/** Delete all tenants with names starting with a prefix (cleanup from previous failed runs) */
async function deleteTestTenants(page: import('@playwright/test').Page) {
  const response = await page.request.get(
    `http://localhost:3000/api/tenants?where[name][like]=${encodeURIComponent('E2E Sync Test')}&limit=100`,
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

  await page.goto(tenantsUrl.create)
  await page.waitForLoadState('domcontentloaded')
  await waitForFormReady(page)

  const slugField = page.locator('#field-slug')
  const dropdownButton = slugField.locator('button.dropdown-indicator')
  await dropdownButton.waitFor({ state: 'visible', timeout: 30000 })

  // The TenantSlugField is a server component — the dropdown may not be interactive
  // immediately after the button renders. Retry clicking until the menu opens.
  const menu = slugField.locator('.rs__menu')
  await expect(async () => {
    await dropdownButton.click()
    await expect(menu).toBeVisible({ timeout: 2000 })
  }).toPass({ timeout: 30000 })

  // Pick the first available option from the dropdown (the server component
  // already filters out slugs that are in use, so any visible option is valid)
  const firstOption = slugField.locator('.rs__option').first()
  await firstOption.waitFor({ state: 'visible', timeout: 10000 })
  // Extract slug from option text, e.g. "Bridgeport Avalanche Center (bac)" -> "bac"
  const optionText = await firstOption.textContent()
  const slugMatch = optionText?.match(/\((\w+)\)$/)
  if (!slugMatch) {
    throw new Error(`Could not extract slug from option text: ${optionText}`)
  }
  const slug = slugMatch[1] as ValidTenantSlug
  await firstOption.click()

  // Fill name after slug selection — AutoFillNameFromSlug overwrites name on slug change
  await page.locator('#field-name').fill(name)
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

    await deleteTestTenants(page)

    try {
      slug = await createTenant(page, TEMP_TENANT_NAME)

      // Navigate to a tenant-scoped collection via client-side nav link (NOT page.goto)
      await openNav(page)
      const navLink = page.locator('nav a[href="/admin/collections/pages"]')
      await navLink.waitFor({ state: 'visible', timeout: 10000 })
      await navLink.click()
      await page.waitForURL('**/admin/collections/pages', { timeout: 30000 })
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

    await deleteTestTenants(page)

    try {
      slug = await createTenant(page, TEMP_TENANT_NAME)

      // We're already on the edit page after creation — rename the tenant
      await waitForFormReady(page)
      await page.locator('#field-name').fill(UPDATED_TENANT_NAME)
      await saveDocAndAssert(page)

      // Navigate to a tenant-scoped collection via client-side nav link (NOT page.goto)
      await openNav(page)
      const navLink = page.locator('nav a[href="/admin/collections/pages"]')
      await navLink.waitFor({ state: 'visible', timeout: 10000 })
      await navLink.click()
      await page.waitForURL('**/admin/collections/pages', { timeout: 30000 })
      await page.waitForLoadState('domcontentloaded')

      const options = await getTenantOptions(page)
      expect(options).toContain(UPDATED_TENANT_NAME)
    } finally {
      if (slug) await deleteTenantBySlug(page, slug)
      await page.context().close()
    }
  })
})
