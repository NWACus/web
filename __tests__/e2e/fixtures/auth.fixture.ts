import { test as base, Page } from '@playwright/test'
import { performLogin } from '../helpers'
import { testUsers, UserRole } from './test-users'

type AuthFixtures = {
  /** Login as a specific user role and return the authenticated page */
  loginAs: (role: UserRole) => Promise<Page>
  /** Login with custom credentials */
  loginWithCredentials: (email: string, password: string) => Promise<Page>
  /** Get a pre-authenticated page for the super admin */
  adminPage: Page
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
    // eslint-disable-next-line react-hooks/rules-of-hooks -- Playwright's `use` is not a React hook
    await use(loginAsRole)
  },

  loginWithCredentials: async ({ browser }, use) => {
    const login = async (email: string, password: string): Promise<Page> => {
      const context = await browser.newContext()
      const page = await context.newPage()
      await performLogin(page, email, password)
      return page
    }
    // eslint-disable-next-line react-hooks/rules-of-hooks -- Playwright's `use` is not a React hook
    await use(login)
  },

  adminPage: async ({ browser }, use) => {
    const user = testUsers.superAdmin
    const context = await browser.newContext()
    const page = await context.newPage()
    await performLogin(page, user.email, user.password)
    // eslint-disable-next-line react-hooks/rules-of-hooks -- Playwright's `use` is not a React hook
    await use(page)
    await context.close()
  },
})

export { expect } from '@playwright/test'
