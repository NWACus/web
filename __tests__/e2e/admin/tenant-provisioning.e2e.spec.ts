import type { Page } from '@playwright/test'
import { expect, authTest as test } from '../fixtures/auth.fixture'
import {
  AdminUrlUtil,
  CollectionSlugs,
  apiRequest,
  getChecklist,
  saveDocAndAssert,
  selectInput,
  waitForFormReady,
} from '../helpers'

// Creates a real tenant through the admin, lets the onboarding checklist
// auto-provision it, and checks what provisioning actually produced.
// onboarding-checklist.e2e.spec.ts only checks that the checklist renders.
test.describe.configure({ mode: 'serial', timeout: 300000 })

const SERVER_URL = 'http://localhost:3000'
const tenantsUrl = new AdminUrlUtil(SERVER_URL, CollectionSlugs.tenants)

// A valid slug that is not seeded and has no theme colors, so provisioning
// ends in "Complete — manual actions remaining" rather than plain "Complete".
const SLUG = 'bac'
const NAME = 'Bridgeport Avalanche Center'
const SLUG_OPTION = `${SLUG} — ${NAME}`

// Mirrors BUILT_IN_PAGES in src/collections/Tenants/endpoints/provisionTenant.ts;
// forecast pages are resolved from AFP and vary per center.
const EXPECTED_BUILT_IN_URLS = [
  '/weather/stations/map',
  '/observations',
  '/observations/submit',
  '/blog',
  '/events',
]
// Mirrors PAGES_TO_PROVISION in provisionTenant.ts (spot check + exact count)
const EXPECTED_PAGE_COUNT = 25
const EXPECTED_PAGE_SLUGS = ['about-us', 'donate-membership', 'learn', 'volunteer']

async function findTenantId(page: Page): Promise<number | undefined> {
  const result = await apiRequest(page, `/api/tenants?where[slug][equals]=${SLUG}&depth=0`)
  return result.body.docs?.[0]?.id
}

async function deleteTenantIfExists(page: Page) {
  const id = await findTenantId(page)
  if (id) {
    const result = await apiRequest(page, `/api/tenants/${id}`, { method: 'DELETE' })
    expect(result.ok, `deleting tenant ${SLUG} failed: ${JSON.stringify(result.body)}`).toBe(true)
  }
}

async function listForTenant(page: Page, collection: string, tenantId: number) {
  const result = await apiRequest(
    page,
    `/api/${collection}?where[tenant][equals]=${tenantId}&limit=200&depth=0`,
  )
  expect(result.ok, `listing ${collection} failed (${result.status})`).toBeTruthy()
  return result.body
}

async function provisionedSnapshot(page: Page, tenantId: number) {
  const [pages, builtInPages, navigations, homePages, settings] = await Promise.all(
    ['pages', 'builtInPages', 'navigations', 'homePages', 'settings'].map((collection) =>
      listForTenant(page, collection, tenantId),
    ),
  )
  return {
    pageCount: pages.totalDocs,
    pageSlugs: pages.docs.map((doc: { slug: string }) => doc.slug).sort(),
    builtInUrls: builtInPages.docs.map((doc: { url: string }) => doc.url).sort(),
    navigationCount: navigations.totalDocs,
    homePageCount: homePages.totalDocs,
    settingsCount: settings.totalDocs,
  }
}

test.describe('Tenant provisioning', () => {
  test('creates the default content, is idempotent, and keeps its status after content edits', async ({
    adminPage: page,
  }) => {
    await page.goto(tenantsUrl.list)
    // Leftover from an aborted run
    await deleteTenantIfExists(page)

    try {
      await page.goto(tenantsUrl.create)
      await waitForFormReady(page)
      await selectInput({ selectLocator: page.locator('#field-slug'), option: SLUG_OPTION })
      await expect(page.locator('#field-name')).toHaveValue(NAME)
      await saveDocAndAssert(page)
      await page.waitForURL(/\/collections\/tenants\/\d+/)

      const tenantId = await findTenantId(page)
      expect(tenantId).toBeTruthy()
      if (!tenantId) return

      // The checklist auto-provisions a brand new tenant on mount
      const checklist = await getChecklist(page)
      await expect(checklist.getByText(/^Complete/)).toBeVisible({ timeout: 180000 })

      const first = await provisionedSnapshot(page, tenantId)
      expect(first.pageCount).toBe(EXPECTED_PAGE_COUNT)
      expect(first.pageSlugs).toEqual(expect.arrayContaining(EXPECTED_PAGE_SLUGS))
      expect(first.builtInUrls).toEqual(expect.arrayContaining(EXPECTED_BUILT_IN_URLS))
      expect(
        first.builtInUrls.some((url: string) => url.startsWith('/forecasts/avalanche')),
        'at least one forecast built-in page',
      ).toBe(true)
      expect(first.navigationCount).toBe(1)
      expect(first.homePageCount).toBe(1)
      expect(first.settingsCount).toBe(1)

      // Rerun: nothing is duplicated and the status stays complete
      await page.getByRole('button', { name: 'Rerun provisioning' }).click()
      await expect(
        page.locator('.toast-success', { hasText: 'Provisioning complete' }),
      ).toBeVisible({ timeout: 180000 })
      expect(await provisionedSnapshot(page, tenantId)).toEqual(first)
      await expect(checklist.getByText(/^Complete/)).toBeVisible()

      // Status is stored on the tenant, not re-derived from live content, so
      // deleting a provisioned page must not un-complete the checklist.
      const pages = await listForTenant(page, 'pages', tenantId)
      const aboutUs = pages.docs.find((doc: { slug: string }) => doc.slug === 'about-us')
      expect(aboutUs).toBeTruthy()
      const removed = await apiRequest(page, `/api/pages/${aboutUs.id}`, { method: 'DELETE' })
      expect(removed.ok).toBe(true)

      await page.reload()
      const reloaded = await getChecklist(page)
      await expect(reloaded.getByText(/^Complete/)).toBeVisible({ timeout: 30000 })
    } finally {
      await page.goto(tenantsUrl.list)
      await deleteTenantIfExists(page)
    }
  })
})
