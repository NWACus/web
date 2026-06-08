import { expect, Page } from '@playwright/test'

const MAX_LOGIN_ATTEMPTS = 3

/**
 * Perform login on the Payload admin login page.
 *
 * Waits for the page to fully stabilize (form ready + network idle) before
 * filling credentials. Retries the entire flow if any step fails.
 */
export async function performLogin(page: Page, email: string, password: string): Promise<void> {
  let lastError: Error | undefined

  for (let attempt = 1; attempt <= MAX_LOGIN_ATTEMPTS; attempt++) {
    try {
      await page.goto('/admin/login')
      await page.locator('form[data-form-ready="true"]').waitFor({ timeout: 15000 })

      const emailInput = page.locator('input[name="email"]')
      const passwordInput = page.locator('input[name="password"]')

      // Filling can race React hydration: the values land in the DOM but not
      // in react-hook-form's state, so submitting clears the fields and fails
      // validation. Re-fill, give the hydration render a moment to (maybe) wipe
      // the inputs, then require the values to have survived - retrying until
      // they stick, by which point hydration is done and RHF has the values.
      await expect(async () => {
        await emailInput.fill(email)
        await passwordInput.fill(password)
        await page.waitForTimeout(300)
        await expect(emailInput).toHaveValue(email)
        await expect(passwordInput).toHaveValue(password)
      }).toPass({ timeout: 15000 })

      await page.locator('button[type="submit"]').click()

      // Wait for navigation to admin dashboard
      await page.locator('.template-default--nav-hydrated').waitFor({ timeout: 30000 })
      return // Login succeeded
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))
      if (attempt < MAX_LOGIN_ATTEMPTS) {
        // Brief pause before retrying
        await page.waitForTimeout(2000)
      }
    }
  }

  throw new Error(
    `Login failed after ${MAX_LOGIN_ATTEMPTS} attempts for ${email}. ` +
      `Page URL: ${page.url()}. Last error: ${lastError?.message}`,
  )
}
