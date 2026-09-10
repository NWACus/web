import { expect, type Locator, type Page } from '@playwright/test'

/** Returns a scoped locator for the onboarding checklist on a tenant edit/create page. */
export async function getChecklist(page: Page): Promise<Locator> {
  await page.locator('form[data-form-ready="true"]').waitFor({ timeout: 15000 })

  const heading = page.getByText('Onboarding Checklist', { exact: true })
  await expect(heading).toBeVisible({ timeout: 10000 })

  // Scope to the checklist's outermost container (the rounded-lg border div)
  const checklist = page.locator('.rounded-lg', { has: heading })
  await expect(checklist).toBeVisible({ timeout: 10000 })

  // On a tenant edit page the body is gated behind a provisioning-status server
  // action that renders a "Loading..." spinner until it resolves; wait for that
  // to clear so the checklist is fully loaded. (No tenant on create = no loader.)
  await checklist.getByText('Loading...').waitFor({ state: 'hidden', timeout: 20000 })

  return checklist
}
