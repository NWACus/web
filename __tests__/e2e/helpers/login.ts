import { expect, Page } from '@playwright/test'

/**
 * Perform login on the Payload admin login page.
 *
 * Waits for the form to be ready (data-form-ready="true"), fills credentials,
 * verifies the fields weren't cleared by a React re-render, then submits.
 */
export async function performLogin(page: Page, email: string, password: string): Promise<void> {
  await page.goto('/admin/login')
  await page.locator('form[data-form-ready="true"]').waitFor({ timeout: 15000 })

  const emailInput = page.locator('input[name="email"]')
  const passwordInput = page.locator('input[name="password"]')

  await emailInput.fill(email)
  await passwordInput.fill(password)

  // Verify fields weren't cleared by a React re-render before submitting
  await expect(emailInput).toHaveValue(email, { timeout: 5000 })
  await expect(passwordInput).not.toHaveValue('', { timeout: 5000 })

  await page.locator('button[type="submit"]').click()
  await page.locator('.template-default--nav-hydrated').waitFor({ timeout: 30000 })
}
