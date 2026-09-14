import { expect, Page } from '@playwright/test'

const MAX_LOGIN_ATTEMPTS = 3

/**
 * Fills and submits the Payload admin login form on the current page.
 *
 * Waits for the form to be ready before filling. Does not wait for the outcome, so
 * callers can assert on either a successful redirect or an error toast.
 */
export async function submitLoginForm(page: Page, email: string, password: string): Promise<void> {
  await page.locator('form[data-form-ready="true"]').waitFor({ timeout: 15000 })

  const emailInput = page.locator('input[name="email"]')
  const passwordInput = page.locator('input[name="password"]')

  // Re-fill until the values survive a render tick - filling can race
  // hydration, leaving them in the DOM but not in react-hook-form's state.
  await expect(async () => {
    await emailInput.fill(email)
    await passwordInput.fill(password)
    await page.waitForTimeout(300)
    await expect(emailInput).toHaveValue(email)
    await expect(passwordInput).toHaveValue(password)
  }).toPass({ timeout: 15000 })

  await page.locator('button[type="submit"]').click()
}

/**
 * Perform login on the Payload admin login page.
 *
 * Waits for the page to fully stabilize (form ready + network idle) before
 * filling credentials. Retries the entire flow if any step fails.
 *
 * Pass `origin` (e.g. `http://nwac.localhost:3000`) to log in on a tenant domain
 * instead of the root domain from `baseURL`.
 */
export async function performLogin(
  page: Page,
  email: string,
  password: string,
  { origin = '' }: { origin?: string } = {},
): Promise<void> {
  let lastError: Error | undefined

  for (let attempt = 1; attempt <= MAX_LOGIN_ATTEMPTS; attempt++) {
    try {
      await page.goto(`${origin}/admin/login`)
      await submitLoginForm(page, email, password)

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
