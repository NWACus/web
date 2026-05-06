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

    await expect(checklist.getByText(/^Complete/)).toBeVisible({ timeout: 10000 })

    await expect(checklist.getByText('Last provisioned:')).toBeVisible({ timeout: 5000 })

    // Settings link points to the tenant's settings document
    const settingsLink = checklist.locator('a', { hasText: 'Website Settings' })
    await expect(settingsLink).toBeVisible()
    await expect(settingsLink).toHaveAttribute('href', /\/admin\/collections\/settings\/\d+/)

    await expect(page.getByRole('button', { name: 'Rerun provisioning' })).toBeVisible({
      timeout: 5000,
    })
  })

  test('shows empty checklist on tenant create page', async ({ adminPage: page }) => {
    await page.goto('/admin/collections/tenants/create')
    const checklist = await getChecklist(page)
    await expect(checklist.getByText('Pages', { exact: true })).toBeVisible()
    await expect(checklist.getByText('Home page')).toBeVisible()
    await expect(checklist.getByText('Navigation')).toBeVisible()
    await expect(checklist.getByText('Website Settings')).toBeVisible()
    await expect(checklist.getByText('Add brand colors')).toBeVisible()
    await expect(checklist.getByText('Add OG image colors')).toBeVisible()
    // No tenantId yet, so status never loads — last-provisioned footer and
    // rerun button stay hidden
    await expect(checklist.getByText('Last provisioned:')).not.toBeVisible({ timeout: 3000 })
    await expect(page.getByRole('button', { name: 'Rerun provisioning' })).not.toBeVisible({
      timeout: 3000,
    })
  })
})
