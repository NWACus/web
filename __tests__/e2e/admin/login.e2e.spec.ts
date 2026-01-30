import { expect, test } from '@playwright/test'
import { openNav } from '../fixtures/nav.fixture'
import { allUserRoles, testUsers } from '../fixtures/test-users'

test.describe('Admin Login', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/admin')
  })

  test('displays login form', async ({ page }) => {
    await expect(page.locator('input[name="email"]')).toBeVisible()
    await expect(page.locator('input[name="password"]')).toBeVisible()
    await expect(page.locator('button[type="submit"]')).toBeVisible()
  })

  // Test login for each user type
  for (const role of allUserRoles) {
    const user = testUsers[role]

    test(`logs in successfully as ${role} (${user.email})`, async ({ page }) => {
      await page.fill('input[name="email"]', user.email)
      await page.fill('input[name="password"]', user.password)
      await page.click('button[type="submit"]')

      // Wait for nav to hydrate and open it to verify login succeeded
      // Payload uses presence of logout button to confirm login
      await openNav(page)
      await expect(page.locator('a[title="Log out"]')).toBeVisible({ timeout: 10000 })
    })
  }

  test('shows error with invalid credentials', async ({ page }) => {
    await page.fill('input[name="email"]', 'invalid@example.com')
    await page.fill('input[name="password"]', 'wrongpassword')
    await page.click('button[type="submit"]')

    // Payload uses toast notifications with .toast-error or .Toastify__toast--error
    await expect(page.locator('.toast-error, .Toastify__toast--error')).toBeVisible({
      timeout: 5000,
    })
  })

  test('shows error with valid email but wrong password', async ({ page }) => {
    const user = testUsers.superAdmin
    await page.fill('input[name="email"]', user.email)
    await page.fill('input[name="password"]', 'definitelywrongpassword')
    await page.click('button[type="submit"]')

    // Should show error toast
    await expect(page.locator('.toast-error, .Toastify__toast--error')).toBeVisible({
      timeout: 5000,
    })
  })

  test('logs out via direct navigation', async ({ page }) => {
    // First login as super admin
    const user = testUsers.superAdmin
    await page.fill('input[name="email"]', user.email)
    await page.fill('input[name="password"]', user.password)
    await page.click('button[type="submit"]')

    // Wait for nav to hydrate and verify login
    await openNav(page)
    await expect(page.locator('a[title="Log out"]')).toBeVisible({ timeout: 10000 })

    // Navigate directly to logout route (same approach as Payload's test helpers)
    await page.goto('/admin/logout')

    // Should redirect to login page - wait for email input to be visible
    await expect(page.locator('input[name="email"]')).toBeVisible({ timeout: 15000 })
  })

  test('logs out via nav button', async ({ page }) => {
    // First login as super admin
    const user = testUsers.superAdmin
    await page.fill('input[name="email"]', user.email)
    await page.fill('input[name="password"]', user.password)
    await page.click('button[type="submit"]')

    // Wait for nav to hydrate and open it
    await openNav(page)
    await expect(page.locator('a[title="Log out"]')).toBeVisible({ timeout: 10000 })

    // Click logout button in nav
    await page.click('a[title="Log out"]')

    // Should redirect to login page - wait for email input to be visible
    await expect(page.locator('input[name="email"]')).toBeVisible({ timeout: 15000 })
  })
})
