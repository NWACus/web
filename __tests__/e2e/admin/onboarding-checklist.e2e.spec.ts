import { expect, authTest as test } from '../fixtures/auth.fixture'
import { TenantIds } from '../helpers/tenant-cookie'

test.describe.configure({ mode: 'serial', timeout: 60000 })

/** Returns a scoped locator for the onboarding checklist. */
async function getChecklist(page: import('@playwright/test').Page) {
  await page.locator('form[data-form-ready="true"]').waitFor({ timeout: 15000 })

  const heading = page.getByText('Onboarding Checklist', { exact: true })
  await expect(heading).toBeVisible({ timeout: 10000 })

  // Scope to the checklist's outermost container (the rounded-lg border div)
  const checklist = page.locator('.rounded-lg', { has: heading })
  await expect(checklist).toBeVisible({ timeout: 10000 })

  return checklist
}

test.describe('Onboarding Checklist', () => {
  test('displays checklist on tenant edit page', async ({ adminPage: page }) => {
    await page.goto(`/admin/collections/tenants/${TenantIds.nwac}`)
    await getChecklist(page)
  })

  test('shows automated section with checklist items', async ({ adminPage: page }) => {
    await page.goto(`/admin/collections/tenants/${TenantIds.nwac}`)
    const checklist = await getChecklist(page)

    // Automated section header
    await expect(checklist.getByText('Automated')).toBeVisible()

    // Core checklist items
    await expect(checklist.getByText('Built-in pages')).toBeVisible()
    await expect(checklist.getByText('Pages - copied from DVAC')).toBeVisible()
    await expect(checklist.getByText('Home page')).toBeVisible()
    await expect(checklist.getByText('Navigation')).toBeVisible()
    await expect(checklist.getByText('Website Settings')).toBeVisible()
  })

  test('shows needs action section with theme items', async ({ adminPage: page }) => {
    await page.goto(`/admin/collections/tenants/${TenantIds.nwac}`)
    const checklist = await getChecklist(page)

    await expect(checklist.getByText('Needs action')).toBeVisible()
    await expect(checklist.getByText('Add brand colors')).toBeVisible()
    await expect(checklist.getByText('Add OG image colors')).toBeVisible()
  })

  test('shows success status for fully provisioned tenant', async ({ adminPage: page }) => {
    await page.goto(`/admin/collections/tenants/${TenantIds.nwac}`)
    const checklist = await getChecklist(page)

    // NWAC is fully provisioned — "Rerun Provisioning" button should not appear
    await expect(checklist.getByText('Rerun Provisioning')).not.toBeVisible({ timeout: 5000 })

    // All automated items should show count details (indicating loaded status)
    await expect(checklist.getByText(/\(\d+\/\d+\)/).first()).toBeVisible({ timeout: 5000 })
  })

  test('shows empty checklist on tenant create page', async ({ adminPage: page }) => {
    await page.goto('/admin/collections/tenants/create')
    const checklist = await getChecklist(page)

    // No tenantId yet, so status never loads — button should not appear
    await expect(checklist.getByText('Rerun Provisioning')).not.toBeVisible({ timeout: 3000 })
  })
})
