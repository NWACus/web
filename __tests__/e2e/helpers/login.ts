import { expect, Page } from '@playwright/test'

const MAX_LOGIN_ATTEMPTS = 3

/**
 * Perform login on the Payload admin login page.
 *
 * Waits for the form to be ready (data-form-ready="true"), fills credentials,
 * verifies the fields weren't cleared by a React re-render, then submits.
 * Retries the entire flow if any step fails (re-renders, slow server, etc).
 */
export async function performLogin(page: Page, email: string, password: string): Promise<void> {
  for (let attempt = 1; attempt <= MAX_LOGIN_ATTEMPTS; attempt++) {
    try {
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

      // Wait for navigation to admin dashboard
      await page.locator('.template-default--nav-hydrated').waitFor({ timeout: 30000 })
      return // Login succeeded
    } catch {
      if (attempt === MAX_LOGIN_ATTEMPTS) {
        throw new Error(
          `Login failed after ${MAX_LOGIN_ATTEMPTS} attempts for ${email}. ` +
            `Page URL: ${page.url()}`,
        )
      }
      // Retry the entire login flow
    }
  }
}
