import { authTest, expect } from '../fixtures/auth.fixture'
import { AdminUrlUtil } from '../helpers/admin-url'
import { saveDocAndAssert, waitForFormReady } from '../helpers/save-doc'
import { setTenantCookie, TenantIds, TenantSlugs } from '../helpers/tenant-cookie'

const SERVER_URL = 'http://localhost:3000'

// Serial: the "hides" tests unpublish a shared seed doc, which would race the
// "shows" tests if both ran in parallel against the same first-published doc.
authTest.describe.configure({ mode: 'serial', timeout: 90000 })

const SUCCESS_TOAST =
  '.toast-success, .Toastify__toast--success, [data-sonner-toast][data-type="success"]'

// First published doc id for a tenant, so tests navigate straight to the edit
// view instead of racing the admin list render. Published docs are public-read.
async function firstPublishedId(
  page: import('@playwright/test').Page,
  collection: 'posts' | 'pages',
  tenantId: number,
): Promise<number> {
  const res = await page.request.get(
    `${SERVER_URL}/api/${collection}?where[_status][equals]=published&where[tenant][equals]=${tenantId}&limit=1&depth=0`,
  )
  expect(res.ok(), `failed to query published ${collection}`).toBeTruthy()
  const id = (await res.json()).docs?.[0]?.id
  expect(id, `no published ${collection} found for tenant ${tenantId}`).toBeTruthy()
  return id
}

authTest.describe('ViewDocumentButton on published documents', () => {
  authTest('shows live document button on a published post', async ({ adminPage }) => {
    const postsUrl = new AdminUrlUtil(SERVER_URL, 'posts')
    await setTenantCookie(adminPage.context(), TenantSlugs.nwac)

    const postId = await firstPublishedId(adminPage, 'posts', Number(TenantIds.nwac))
    await adminPage.goto(postsUrl.edit(postId))

    await expect(adminPage.locator('#view-document-button')).toBeVisible()
  })

  authTest('shows live document button on a published page', async ({ adminPage }) => {
    const pagesUrl = new AdminUrlUtil(SERVER_URL, 'pages')
    await setTenantCookie(adminPage.context(), TenantSlugs.nwac)

    const pageId = await firstPublishedId(adminPage, 'pages', Number(TenantIds.nwac))
    await adminPage.goto(pagesUrl.edit(pageId))

    await expect(adminPage.locator('#view-document-button')).toBeVisible()
  })
})

authTest.describe('ViewDocumentButton hidden on draft documents', () => {
  // Track the document URL so afterEach can re-publish even if the test fails
  let unpublishedDocUrl: string | null = null

  authTest.afterEach(async ({ adminPage }) => {
    if (unpublishedDocUrl) {
      await adminPage.goto(unpublishedDocUrl)
      await waitForFormReady(adminPage)
      await saveDocAndAssert(adminPage, '#action-save')
      unpublishedDocUrl = null
    }
  })

  async function unpublishCurrentDoc(page: import('@playwright/test').Page) {
    await page.locator('.doc-controls__popup .popup-button').click()
    // Popup content is portaled to body, so use a global (unscoped) selector
    const unpublishButton = page.getByRole('button', { name: 'Unpublish', exact: true })
    await unpublishButton.waitFor({ timeout: 10000 })
    await unpublishButton.click()
    await page.locator('#confirm-action').click()

    unpublishedDocUrl = page.url()
    await expect(page.locator(SUCCESS_TOAST)).toBeVisible({ timeout: 15000 })
  }

  authTest('hides live document button on a draft post', async ({ adminPage }) => {
    const postsUrl = new AdminUrlUtil(SERVER_URL, 'posts')
    await setTenantCookie(adminPage.context(), TenantSlugs.nwac)

    const postId = await firstPublishedId(adminPage, 'posts', Number(TenantIds.nwac))
    await adminPage.goto(postsUrl.edit(postId))
    await expect(adminPage.locator('#view-document-button')).toBeVisible()

    await unpublishCurrentDoc(adminPage)

    // Button is server-rendered, so reload to re-read it
    await adminPage.reload()
    await waitForFormReady(adminPage)

    await expect(adminPage.locator('#view-document-button')).not.toBeVisible()
  })

  authTest('hides live document button on a draft page', async ({ adminPage }) => {
    const pagesUrl = new AdminUrlUtil(SERVER_URL, 'pages')
    await setTenantCookie(adminPage.context(), TenantSlugs.nwac)

    const pageId = await firstPublishedId(adminPage, 'pages', Number(TenantIds.nwac))
    await adminPage.goto(pagesUrl.edit(pageId))
    await expect(adminPage.locator('#view-document-button')).toBeVisible()

    await unpublishCurrentDoc(adminPage)

    // Button is server-rendered, so reload to re-read it
    await adminPage.reload()
    await waitForFormReady(adminPage)

    await expect(adminPage.locator('#view-document-button')).not.toBeVisible()
  })
})
