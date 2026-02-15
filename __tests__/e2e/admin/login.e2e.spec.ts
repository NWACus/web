import { expect, test } from '@playwright/test'
import { openNav } from '../fixtures/nav.fixture'
import { testUsers } from '../fixtures/test-users'
import { performLogin } from '../helpers'

test.describe.configure({ mode: 'serial', timeout: 90000 })

test.describe('Payload CMS Login', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/admin/login')
    // Wait for Payload's form to be fully mounted and ready
    await page.locator('form[data-form-ready="true"]').waitFor({ timeout: 15000 })
  })

  test('displays login form', async ({ page }) => {
    await expect(page.locator('input[name="email"]')).toBeVisible()
    await expect(page.locator('input[name="password"]')).toBeVisible()
    await expect(page.locator('button[type="submit"]')).toBeVisible()
  })

  // Test login for each user type
  for (const [role, user] of Object.entries(testUsers)) {
    test(`logs in successfully as ${role} (${user.email})`, async ({ page }) => {
      await performLogin(page, user.email, user.password)

      await openNav(page)
      await expect(page.getByRole('button', { name: 'Log out' })).toBeVisible({ timeout: 10000 })
    })
  }

  test('shows error with invalid credentials', async ({ page }) => {
    await page.fill('input[name="email"]', 'invalid@example.com')
    await page.fill('input[name="password"]', 'wrongpassword')
    await page.click('button[type="submit"]')

    // Payload 3.x uses Sonner toasts with .toast-error class
    await expect(page.locator('.toast-error')).toBeVisible({
      timeout: 5000,
    })
  })

  test('shows error with valid email but wrong password', async ({ page }) => {
    const user = testUsers.superAdmin
    await page.fill('input[name="email"]', user.email)
    await page.fill('input[name="password"]', 'definitelywrongpassword')
    await page.click('button[type="submit"]')

    // Payload 3.x uses Sonner toasts with .toast-error class
    await expect(page.locator('.toast-error')).toBeVisible({
      timeout: 5000,
    })
  })

  // /admin/logout doesn't redirect to login without Edge Config (local + CI)
  test.fixme('logs out via direct navigation', async ({ page }) => {
    await performLogin(page, testUsers.superAdmin.email, testUsers.superAdmin.password)

    // Navigate directly to logout route (same approach as Payload's test helpers)
    await page.goto('/admin/logout')

    // Should redirect to login page - wait for email input to be visible
    await expect(page.locator('input[name="email"]')).toBeVisible({ timeout: 15000 })
  })

  test('logs out via nav button', async ({ page }) => {
    await performLogin(page, testUsers.superAdmin.email, testUsers.superAdmin.password)

    // Open nav and click the logout button (calls logOut() directly, not a link)
    await openNav(page)
    await page.getByRole('button', { name: 'Log out' }).click()

    // Wait for redirect back to login page after logout completes
    await page.locator('form[data-form-ready="true"]').waitFor({ timeout: 30000 })
    await expect(page.locator('input[name="email"]')).toBeVisible()
  })
})
