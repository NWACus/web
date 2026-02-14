/* eslint-disable react-hooks/rules-of-hooks -- Playwright's `use` is not a React hook */
import { test as base, expect, Page } from '@playwright/test'
import {
  getSelectInputOptions,
  getSelectInputValue,
  getTenantCookieFromPage,
  isSelectReadOnly,
  performLogin,
  selectInput,
  setTenantCookieFromPage,
  TenantNames,
  TenantSlugs,
  waitForTenantCookie,
  type TenantSlug,
} from '../helpers'
import { openNav } from './nav.fixture'
import { testUsers, UserRole } from './test-users'

type TenantSelectorFixtures = {
  /**
   * Login as a specific user role and return the authenticated page.
   */
  loginAs: (role: UserRole) => Promise<Page>

  /**
   * Get the tenant selector locator on the current page.
   * Returns null if tenant selector is not visible.
   */
  getTenantSelector: (page: Page) => Promise<ReturnType<Page['locator']> | null>

  /**
   * Get the current selected tenant from the tenant selector.
   * Returns undefined if no tenant is selected or selector not visible.
   */
  getSelectedTenant: (page: Page) => Promise<string | undefined>

  /**
   * Get all available tenant options from the tenant selector dropdown.
   */
  getTenantOptions: (page: Page) => Promise<string[]>

  /**
   * Select a tenant from the tenant selector dropdown.
   */
  selectTenant: (page: Page, tenantName: string) => Promise<void>

  /**
   * Check if the tenant selector is visible on the page.
   */
  isTenantSelectorVisible: (page: Page) => Promise<boolean>

  /**
   * Check if the tenant selector is read-only (disabled).
   */
  isTenantSelectorReadOnly: (page: Page) => Promise<boolean>

  /**
   * Get the current tenant cookie value.
   */
  getTenantCookie: (page: Page) => Promise<string | undefined>

  /**
   * Set the tenant cookie directly (before navigation).
   */
  setTenantCookie: (page: Page, slug: TenantSlug | undefined) => Promise<void>

  /**
   * Wait for the tenant cookie to be set to a specific value.
   */
  waitForTenantCookie: (page: Page, expectedSlug: string) => Promise<void>
}

/**
 * Tenant selector test fixture.
 * Provides helpers for interacting with the tenant selector in admin tests.
 */
export const tenantSelectorTest = base.extend<TenantSelectorFixtures>({
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

  getTenantSelector: async ({}, use) => {
    const getTenantSelector = async (page: Page) => {
      // Wait for nav to be hydrated first
      await page.locator('.template-default--nav-hydrated').waitFor({ timeout: 10000 })

      // Open nav to ensure tenant selector is visible
      await openNav(page)

      const selector = page.locator('.tenant-selector')
      if (await selector.isVisible()) {
        return selector
      }
      return null
    }
    await use(getTenantSelector)
  },

  getSelectedTenant: async ({}, use) => {
    const getSelectedTenant = async (page: Page): Promise<string | undefined> => {
      await page.locator('.template-default--nav-hydrated').waitFor({ timeout: 10000 })
      await openNav(page)

      const selector = page.locator('.tenant-selector')
      if (!(await selector.isVisible())) {
        return undefined
      }

      const value = await getSelectInputValue({
        selectLocator: selector,
        multiSelect: false,
      })

      return value === false ? undefined : value
    }
    await use(getSelectedTenant)
  },

  getTenantOptions: async ({}, use) => {
    const getTenantOptions = async (page: Page): Promise<string[]> => {
      await page.locator('.template-default--nav-hydrated').waitFor({ timeout: 10000 })
      await openNav(page)

      const selector = page.locator('.tenant-selector')
      if (!(await selector.isVisible())) {
        return []
      }

      return getSelectInputOptions({ selectLocator: selector })
    }
    await use(getTenantOptions)
  },

  selectTenant: async ({}, use) => {
    const doSelectTenant = async (page: Page, tenantName: string): Promise<void> => {
      await page.locator('.template-default--nav-hydrated').waitFor({ timeout: 10000 })
      await openNav(page)

      const selector = page.locator('.tenant-selector')
      await expect(selector).toBeVisible()

      await selectInput({
        selectLocator: selector,
        option: tenantName,
      })
    }
    await use(doSelectTenant)
  },

  isTenantSelectorVisible: async ({}, use) => {
    const checkVisibility = async (page: Page): Promise<boolean> => {
      await page.locator('.template-default--nav-hydrated').waitFor({ timeout: 10000 })
      await openNav(page)

      const selector = page.locator('.tenant-selector')
      return selector.isVisible()
    }
    await use(checkVisibility)
  },

  isTenantSelectorReadOnly: async ({}, use) => {
    const checkReadOnly = async (page: Page): Promise<boolean> => {
      await page.locator('.template-default--nav-hydrated').waitFor({ timeout: 10000 })
      await openNav(page)

      const selector = page.locator('.tenant-selector')
      if (!(await selector.isVisible())) {
        return false
      }

      return isSelectReadOnly({ selectLocator: selector })
    }
    await use(checkReadOnly)
  },

  getTenantCookie: async ({}, use) => {
    await use(getTenantCookieFromPage)
  },

  setTenantCookie: async ({}, use) => {
    const setCookie = async (page: Page, slug: TenantSlug | undefined): Promise<void> => {
      await setTenantCookieFromPage(page, slug)
    }
    await use(setCookie)
  },

  waitForTenantCookie: async ({}, use) => {
    const waitForCookie = async (page: Page, expectedSlug: string): Promise<void> => {
      await waitForTenantCookie(page, expectedSlug)
    }
    await use(waitForCookie)
  },
})

export { expect } from '@playwright/test'
export { TenantNames, TenantSlugs }
