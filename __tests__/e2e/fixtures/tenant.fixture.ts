import { test as base, Page } from '@playwright/test'

type TenantSlug = 'nwac' | 'dvac' | 'sac' | 'snfac'

export const tenantTest = base.extend<{
  tenantPage: (tenant: TenantSlug) => Promise<Page>
}>({
  tenantPage: async ({ browser }, use) => {
    const createTenantPage = async (tenant: TenantSlug) => {
      const context = await browser.newContext()
      const page = await context.newPage()
      await page.goto(`http://${tenant}.localhost:3000`)
      return page
    }
    // eslint-disable-next-line react-hooks/rules-of-hooks
    await use(createTenantPage)
  },
})

export const tenantSlugs: TenantSlug[] = ['nwac', 'dvac', 'sac', 'snfac']
