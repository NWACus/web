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
 * These tests run in serial order: test 1 creates a tenant, test 2 edits
 * and then cleans it up.
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

/** Delete a tenant by slug if it exists */
async function deleteTenantBySlug(page: import('@playwright/test').Page, slug: string) {
  const response = await page.request.get(
    `http://localhost:3000/api/tenants?where[slug][equals]=${slug}&limit=1`,
  )
  const data = await response.json()
  if (data.docs?.[0]) {
    await page.request.delete(`http://localhost:3000/api/tenants/${data.docs[0].id}`)
  }
}

test.describe('Tenant selector syncs on save', () => {
  let tempTenantSlug: ValidTenantSlug

  test('should show new tenant in selector after creation', async ({
    loginAs,
    getTenantOptions,
  }) => {
    const page = await loginAs('superAdmin')
    const tenantsUrl = new AdminUrlUtil('http://localhost:3000', CollectionSlugs.tenants)

    tempTenantSlug = await findUnusedTenantSlug(page)

    try {
      // Navigate to create a new tenant
      await page.goto(tenantsUrl.create)
      await page.waitForLoadState('networkidle')
      await waitForFormReady(page)

      await page.locator('#field-name').fill(TEMP_TENANT_NAME)
      // Slug is a select dropdown — open it, filter, and click the matching option
      const slugField = page.locator('#field-slug')
      await slugField.locator('button.dropdown-indicator').click()
      await slugField.locator('.rs__option', { hasText: tempTenantSlug }).click()

      // Before save: checklist should show labels but no counts or instructions
      const heading = page.getByText('Onboarding Checklist', { exact: true })
      await expect(heading).toBeVisible({ timeout: 10000 })
      const checklist = page.locator('.rounded-lg', { has: heading })
      await expect(checklist.getByText('Built-in pages')).toBeVisible()
      await expect(checklist.getByText('Home page')).toBeVisible()
      await expect(checklist.getByText(/\(\d+\/\d+\)/)).not.toBeVisible()
      await expect(checklist.getByText('colors.css')).not.toBeVisible()
      await expect(checklist.getByText('centerColorMap')).not.toBeVisible()

      await saveDocAndAssert(page)

      // After save: should show toast and spinners, but hide details during provisioning
      await expect(page.getByText('Building avy center...')).toBeVisible({ timeout: 10000 })
      await expect(checklist.locator('[data-testid="spinner"]').first()).toBeVisible()
      await expect(checklist.getByText(/\(\d+\/\d+\)/)).not.toBeVisible()
      await expect(checklist.getByText('colors.css')).not.toBeVisible()
      await expect(checklist.getByText('centerColorMap')).not.toBeVisible()

      // Wait for provisioning to complete — counts and checkmarks should appear
      await expect(checklist.getByText(/\(\d+\/\d+\)/).first()).toBeVisible({ timeout: 30000 })
      await expect(page.getByText('Building avy center...')).not.toBeVisible({ timeout: 10000 })

      // Skipped demo pages should be listed if any exist
      const skippedText = checklist.getByText(/Skipped \(demo pages\):/)
      if (await skippedText.isVisible({ timeout: 2000 }).catch(() => false)) {
        await expect(skippedText).toBeVisible()
      }

      // Settings link should be present after provisioning
      await expect(checklist.getByText('Update Brand Assets')).toBeVisible()

      // Manual theme items should show instructions (new tenant has no colors configured)
      await expect(checklist.getByText('colors.css')).toBeVisible()
      await expect(checklist.getByText('centerColorMap')).toBeVisible()

      // Rerun button should show if not fully provisioned, or be hidden if complete
      const rerunButton = checklist.getByText('Rerun Provisioning')
      const isVisible = await rerunButton.isVisible({ timeout: 2000 }).catch(() => false)
      if (isVisible) {
        await expect(rerunButton).toBeEnabled()
      }

      // Navigate to a tenant-scoped collection via client-side nav link (NOT page.goto)
      await openNav(page)
      await Promise.all([
        page.waitForURL('**/admin/collections/pages'),
        page.locator('nav a[href="/admin/collections/pages"]').click(),
      ])
      await page.waitForLoadState('networkidle')

      // The tenant selector should show the new tenant without a full page reload
      const options = await getTenantOptions(page)
      expect(options).toContain(TEMP_TENANT_NAME)
    } finally {
      await page.context().close()
    }
  })

  test('should update tenant name in selector after editing', async ({
    loginAs,
    getTenantOptions,
  }) => {
    const page = await loginAs('superAdmin')
    const tenantsUrl = new AdminUrlUtil('http://localhost:3000', CollectionSlugs.tenants)

    try {
      // Find the tenant created by the previous test
      const response = await page.request.get(
        `http://localhost:3000/api/tenants?where[slug][equals]=${tempTenantSlug}&limit=1`,
      )
      const data = await response.json()
      const tenantId = data.docs?.[0]?.id
      if (!tenantId) {
        throw new Error(`Tenant with slug "${tempTenantSlug}" not found — test 1 may have failed`)
      }

      // Navigate to the tenant edit page
      await page.goto(tenantsUrl.edit(tenantId))
      await page.waitForLoadState('networkidle')
      await waitForFormReady(page)

      // Rename the tenant
      await page.locator('#field-name').fill(UPDATED_TENANT_NAME)
      await saveDocAndAssert(page)

      // Navigate to a tenant-scoped collection via client-side nav link (NOT page.goto)
      await openNav(page)
      await Promise.all([
        page.waitForURL('**/admin/collections/pages'),
        page.locator('nav a[href="/admin/collections/pages"]').click(),
      ])
      await page.waitForLoadState('networkidle')

      const options = await getTenantOptions(page)
      expect(options).toContain(UPDATED_TENANT_NAME)
      expect(options).not.toContain(TEMP_TENANT_NAME)
    } finally {
      await deleteTenantBySlug(page, tempTenantSlug)
      await page.context().close()
    }
  })
})
