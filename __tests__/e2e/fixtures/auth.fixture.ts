import { test as base, Page } from '@playwright/test'
import { testUsers, UserRole } from './test-users'

type AuthFixtures = {
  /** Login as a specific user role and return the authenticated page */
  loginAs: (role: UserRole) => Promise<Page>
  /** Login with custom credentials */
  loginWithCredentials: (email: string, password: string) => Promise<Page>
  /** Get a pre-authenticated page for the super admin */
  adminPage: Page
}

async function performLogin(page: Page, email: string, password: string): Promise<void> {
  await page.goto('/admin/login')
  await page.locator('form[data-form-ready="true"]').waitFor({ timeout: 15000 })
  await page.fill('input[name="email"]', email)
  await page.fill('input[name="password"]', password)
  await page.locator('button[type="submit"]').click()
  await page.locator('.template-default--nav-hydrated').waitFor({ timeout: 30000 })
}

export const authTest = base.extend<AuthFixtures>({
  loginAs: async ({ browser }, use) => {
    const loginAsRole = async (role: UserRole): Promise<Page> => {
      const user = testUsers[role]
      const context = await browser.newContext()
      const page = await context.newPage()
      await performLogin(page, user.email, user.password)
      return page
    }
    await use(loginAsRole)
  },

  loginWithCredentials: async ({ browser }, use) => {
    const login = async (email: string, password: string): Promise<Page> => {
      const context = await browser.newContext()
      const page = await context.newPage()
      await performLogin(page, email, password)
      return page
    }
    await use(login)
  },

  adminPage: async ({ browser }, use) => {
    const user = testUsers.superAdmin
    const context = await browser.newContext()
    const page = await context.newPage()
    await performLogin(page, user.email, user.password)
    await use(page)
    await context.close()
  },
})

export { expect } from '@playwright/test'
