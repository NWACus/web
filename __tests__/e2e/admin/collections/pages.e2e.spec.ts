import type { Page } from '@playwright/test'
import { authTest, expect } from '../../fixtures/auth.fixture'
import {
  AdminUrlUtil,
  MINIMAL_CONTENT_BLOCK,
  TenantSlugs,
  apiRequest,
  createDraftDoc,
  deleteDoc,
  openDocControls,
  saveDocAndAssert,
  setTenantCookie,
  tenantBaseUrl,
  waitForFormReady,
} from '../../helpers'

const SERVER_URL = 'http://localhost:3000'

authTest.describe('Pages collection publishedAt field', () => {
  authTest.describe.configure({ mode: 'serial', timeout: 90000 })

  authTest('publishedAt shows day and time picker on pages', async ({ adminPage }) => {
    const pagesUrl = new AdminUrlUtil(SERVER_URL, 'pages')
    await setTenantCookie(adminPage.context(), TenantSlugs.nwac)

    await adminPage.goto(pagesUrl.list)
    const pageId = await createDraftDoc(adminPage, 'pages', {})

    try {
      await adminPage.goto(pagesUrl.edit(pageId))
      await waitForFormReady(adminPage)

      // The publishedAt field should have a value (auto-populated on create).
      const publishedAtInput = adminPage.locator('#field-publishedAt input')
      await expect(publishedAtInput).toBeVisible({ timeout: 10000 })
      expect(await publishedAtInput.inputValue()).toBeTruthy()
    } finally {
      await deleteDoc(adminPage, 'pages', pageId)
    }
  })

  authTest(
    'pages publishedAt field does not have misleading description',
    async ({ adminPage }) => {
      const pagesUrl = new AdminUrlUtil(SERVER_URL, 'pages')
      await setTenantCookie(adminPage.context(), TenantSlugs.nwac)

      await adminPage.goto(pagesUrl.list)
      const pageId = await createDraftDoc(adminPage, 'pages', {})

      try {
        await adminPage.goto(pagesUrl.edit(pageId))
        await waitForFormReady(adminPage)

        // The misleading description should NOT be present
        const sidebar = adminPage.locator('.field-type.date')
        await expect(sidebar.locator('text=visibility')).not.toBeVisible()
        await expect(sidebar.locator('text=scheduling future publications')).not.toBeVisible()
      } finally {
        await deleteDoc(adminPage, 'pages', pageId)
      }
    },
  )
})

// Draft → publish → public → unpublish → gone. Pages are force-static with a
// 1h revalidate window, so a change is only visible once the publish hooks
// revalidate the page's paths (see docs/revalidation.md); the public checks
// poll rather than assuming an instant flip.
authTest.describe('Pages publish lifecycle', () => {
  authTest.describe.configure({ timeout: 150000 })

  async function expectPublicPage(
    page: Page,
    url: string,
    expected: { visible: true; title: string } | { visible: false },
  ) {
    await expect(async () => {
      const response = await page.goto(url)
      if (!response) throw new Error(`no response for ${url}`)
      if (expected.visible) {
        expect(response.status()).toBe(200)
        await expect(page.getByRole('heading', { name: expected.title, level: 1 })).toBeVisible()
      } else {
        expect(response.status()).toBe(404)
        await expect(page.getByRole('heading', { name: 'Route not found' })).toBeVisible()
      }
    }).toPass({ timeout: 30000, intervals: [1000, 2000, 3000] })
  }

  authTest(
    'a draft is not public, publishing makes it public, unpublishing hides it again',
    async ({ adminPage, browser }) => {
      const pagesUrl = new AdminUrlUtil(SERVER_URL, 'pages')
      await setTenantCookie(adminPage.context(), TenantSlugs.nwac)
      await adminPage.goto(pagesUrl.list)

      const slug = `e2e-lifecycle-${Date.now()}`
      const title = 'E2E lifecycle page'
      const pageId = await createDraftDoc(adminPage, 'pages', {
        slug,
        title,
        layout: [MINIMAL_CONTENT_BLOCK],
      })
      const publicUrl = `${tenantBaseUrl('nwac')}/${slug}`

      // Logged-out visitor
      const context = await browser.newContext()
      const page = await context.newPage()

      try {
        await expectPublicPage(page, publicUrl, { visible: false })
        // Drafts are not readable through the API without a session either
        const anonymousRead = await apiRequest(page, `/api/pages/${pageId}?draft=true`)
        expect([403, 404]).toContain(anonymousRead.status)

        // Publish from the admin
        await adminPage.goto(pagesUrl.edit(pageId))
        await waitForFormReady(adminPage)
        await saveDocAndAssert(adminPage, '#action-save')

        await expectPublicPage(page, publicUrl, { visible: true, title })
        const publicRead = await apiRequest(page, `/api/pages/${pageId}`)
        expect(publicRead.status).toBe(200)

        // Unpublish from the admin
        await openDocControls(adminPage)
        await adminPage.locator('#action-unpublish').click()
        await adminPage.locator('#confirm-action').click()
        await expect(adminPage.locator('.toast-success').first()).toBeVisible({ timeout: 15000 })

        await expectPublicPage(page, publicUrl, { visible: false })
      } finally {
        await context.close()
        await deleteDoc(adminPage, 'pages', pageId)
      }
    },
  )
})
