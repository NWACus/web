import type { BrowserContext, Page } from '@playwright/test'

/**
 * The cookie name used by Payload for tenant selection.
 */
export const TENANT_COOKIE_NAME = 'payload-tenant'

/**
 * Gets the current tenant cookie value from the browser context.
 *
 * @param context - The browser context (or page.context())
 * @returns The tenant slug or undefined if not set
 */
export async function getTenantCookie(context: BrowserContext): Promise<string | undefined> {
  const cookies = await context.cookies()
  const tenantCookie = cookies.find((c) => c.name === TENANT_COOKIE_NAME)
  return tenantCookie?.value
}

/**
 * Gets the current tenant cookie value from a page.
 */
export async function getTenantCookieFromPage(page: Page): Promise<string | undefined> {
  return getTenantCookie(page.context())
}

/**
 * Sets the tenant cookie in the browser context.
 *
 * @param context - The browser context
 * @param tenantSlug - The tenant slug to set, or undefined to clear
 * @param baseURL - The base URL for the cookie domain (defaults to localhost:3000)
 */
export async function setTenantCookie(
  context: BrowserContext,
  tenantSlug: string | undefined,
  baseURL = 'http://localhost:3000',
): Promise<void> {
  const url = new URL(baseURL)

  if (tenantSlug === undefined) {
    // Clear the cookie by setting it with an expired date
    await context.addCookies([
      {
        name: TENANT_COOKIE_NAME,
        value: '',
        domain: url.hostname,
        path: '/',
        expires: 0,
      },
    ])
  } else {
    // Set the cookie with a 1-year expiration (matching production behavior)
    const oneYearFromNow = Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60
    await context.addCookies([
      {
        name: TENANT_COOKIE_NAME,
        value: tenantSlug,
        domain: url.hostname,
        path: '/',
        expires: oneYearFromNow,
      },
    ])
  }
}

/**
 * Sets the tenant cookie from a page.
 */
export async function setTenantCookieFromPage(
  page: Page,
  tenantSlug: string | undefined,
  baseURL?: string,
): Promise<void> {
  return setTenantCookie(page.context(), tenantSlug, baseURL)
}

/**
 * Clears the tenant cookie from the browser context.
 */
export async function clearTenantCookie(
  context: BrowserContext,
  baseURL = 'http://localhost:3000',
): Promise<void> {
  return setTenantCookie(context, undefined, baseURL)
}

/**
 * Clears the tenant cookie from a page.
 */
export async function clearTenantCookieFromPage(page: Page, baseURL?: string): Promise<void> {
  return clearTenantCookie(page.context(), baseURL)
}

/**
 * Waits for the tenant cookie to be set to a specific value.
 *
 * @param page - The page to check
 * @param expectedSlug - The expected tenant slug
 * @param timeout - Maximum time to wait in ms (default: 5000)
 */
export async function waitForTenantCookie(
  page: Page,
  expectedSlug: string,
  timeout = 5000,
): Promise<void> {
  const startTime = Date.now()

  while (Date.now() - startTime < timeout) {
    const currentSlug = await getTenantCookieFromPage(page)
    if (currentSlug === expectedSlug) {
      return
    }
    await page.waitForTimeout(100)
  }

  throw new Error(
    `Timeout waiting for tenant cookie to be "${expectedSlug}". ` +
      `Current value: "${await getTenantCookieFromPage(page)}"`,
  )
}

/**
 * Available tenant slugs for testing.
 * These match the seeded tenants in the database.
 */
export const TenantSlugs = {
  dvac: 'dvac',
  nwac: 'nwac',
  sac: 'sac',
  snfac: 'snfac',
} as const

export type TenantSlug = (typeof TenantSlugs)[keyof typeof TenantSlugs]

/**
 * Display names for tenants as shown in the admin tenant selector dropdown.
 * These match the seeded tenant names in the database.
 */
export const TenantNames = {
  dvac: 'Death Valley Avalanche Center',
  nwac: 'Northwest Avalanche Center',
  sac: 'Sierra Avalanche Center',
  snfac: 'Sawtooth Avalanche Center',
} as const

// Hopefully remove soon
export const TenantIds = {
  dvac: '1',
  nwac: '2',
  sac: '3',
  snfac: '4',
} as const
