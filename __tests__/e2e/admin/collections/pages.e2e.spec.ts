import { authTest, expect } from '../../fixtures/auth.fixture'
import { AdminUrlUtil } from '../../helpers/admin-url'
import { createDraftDoc, deleteDoc } from '../../helpers/create-doc'
import { waitForFormReady } from '../../helpers/save-doc'
import { setTenantCookie, TenantSlugs } from '../../helpers/tenant-cookie'

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
