import type { Page } from '@playwright/test'
import { authTest, expect } from '../../fixtures/auth.fixture'
import type { UserRole } from '../../fixtures/test-users'
import {
  AdminUrlUtil,
  CollectionSlugs,
  TenantIds,
  TenantSlugs,
  apiRequest,
  createDraftDoc,
  deleteDoc,
  setTenantCookie,
} from '../../helpers'

const SERVER_URL = 'http://localhost:3000'
const pagesUrl = new AdminUrlUtil(SERVER_URL, CollectionSlugs.pages)

const KNOWN_HOLE =
  'byTenantRole returns an unconstrained `true` when the payload-tenant cookie names one of ' +
  "the user's own tenants, so any tenant admin can read, update and delete other tenants' " +
  'documents by ID — see #1276'

/** The edit view either renders Payload's "Nothing found" view or bounces to the list. */
async function expectEditViewRefused(page: Page) {
  await expect(async () => {
    const refused =
      page.url().includes('notFound=') || (await page.getByText('Nothing found').isVisible())
    expect(refused, `expected the edit view to be refused, at ${page.url()}`).toBe(true)
  }).toPass({ timeout: 15000 })
  await expect(page.locator('#field-title')).toHaveCount(0)
}

/** Read, update and delete by ID must all be refused. */
async function expectRestRefused(page: Page, id: number) {
  const read = await apiRequest(page, `/api/pages/${id}?draft=true`)
  expect.soft([403, 404], `read returned ${read.status}`).toContain(read.status)

  const update = await apiRequest(page, `/api/pages/${id}?draft=true`, {
    method: 'PATCH',
    body: { title: 'Tampered by another tenant' },
  })
  expect.soft([403, 404], `update returned ${update.status}`).toContain(update.status)

  const remove = await apiRequest(page, `/api/pages/${id}`, { method: 'DELETE' })
  expect.soft([403, 404], `delete returned ${remove.status}`).toContain(remove.status)
}

// The NWAC admin (singleTenantAdmin) has no role in SAC. The tenant-selector
// suite covers list filtering; this covers the actual boundary when a document
// from another tenant is addressed directly by ID.
authTest.describe('Cross-tenant document access', () => {
  authTest.describe.configure({ timeout: 90000 })

  const SAC_TITLE = 'SAC-only draft page'
  let sacPageId: number

  authTest.beforeEach(async ({ adminPage }) => {
    await setTenantCookie(adminPage.context(), TenantSlugs.sac)
    await adminPage.goto(pagesUrl.list)
    sacPageId = await createDraftDoc(adminPage, 'pages', {
      tenant: Number(TenantIds.sac),
      title: SAC_TITLE,
    })
  })

  authTest.afterEach(async ({ adminPage }) => {
    // Verify the SAC document survived untouched before removing it
    const doc = await apiRequest(adminPage, `/api/pages/${sacPageId}?draft=true`)
    expect(doc.status, 'SAC document should still exist').toBe(200)
    expect(doc.body.title).toBe(SAC_TITLE)
    await deleteDoc(adminPage, 'pages', sacPageId)
  })

  // Selecting your own tenant in the admin (or opening the admin on your tenant's
  // domain) sets the cookie to that tenant, so that is the normal state for an
  // admin; the no-cookie state is what a fresh API session sees.
  const states = [
    { name: 'with no tenant selected', tenantCookie: undefined, knownHole: false },
    {
      name: "with the user's own tenant selected",
      tenantCookie: TenantSlugs.nwac,
      knownHole: true,
    },
  ]

  for (const { name, tenantCookie, knownHole } of states) {
    authTest.describe(name, () => {
      async function nwacAdminPage(loginAs: (role: UserRole) => Promise<Page>) {
        const page = await loginAs('singleTenantAdmin')
        if (tenantCookie) await setTenantCookie(page.context(), tenantCookie)
        return page
      }

      authTest('the admin edit view is refused', async ({ loginAs }) => {
        authTest.fail(knownHole, KNOWN_HOLE)
        const page = await nwacAdminPage(loginAs)
        await page.goto(pagesUrl.edit(sacPageId))
        await expectEditViewRefused(page)
        await page.context().close()
      })

      authTest('REST read, update and delete are refused', async ({ loginAs }) => {
        authTest.fail(knownHole, KNOWN_HOLE)
        const page = await nwacAdminPage(loginAs)
        // Fetch from the root landing page rather than the admin, whose tenant
        // selector would set the tenant cookie on load and change the state under test
        await page.goto('/')
        await expectRestRefused(page, sacPageId)
        await page.context().close()
      })
    })
  }
})
