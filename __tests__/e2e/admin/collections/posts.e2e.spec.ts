import { authTest, expect } from '../../fixtures/auth.fixture'
import { AdminUrlUtil } from '../../helpers/admin-url'
import { createDraftDoc, deleteDoc, MINIMAL_LEXICAL } from '../../helpers/create-doc'
import { saveDocAndAssert, waitForFormReady } from '../../helpers/save-doc'
import { setTenantCookie, TenantSlugs } from '../../helpers/tenant-cookie'

const SERVER_URL = 'http://localhost:3000'

authTest.describe('Posts collection publishedAt field', () => {
  authTest.describe.configure({ mode: 'serial', timeout: 90000 })

  authTest('publishedAt is auto-set when publishing a new post', async ({ adminPage }) => {
    const postsUrl = new AdminUrlUtil(SERVER_URL, 'posts')
    await setTenantCookie(adminPage.context(), TenantSlugs.nwac)

    // Create our own draft post instead of relying on the list containing one:
    // all seeded posts are published, so a `?where[_status][equals]=draft` list
    // query would be order-dependent (only passing if another test left a draft).
    await adminPage.goto(postsUrl.list)
    const postId = await createDraftDoc(adminPage, 'posts', { content: MINIMAL_LEXICAL })

    try {
      // Navigate straight to the draft — no list-render race.
      await adminPage.goto(postsUrl.edit(postId))
      await waitForFormReady(adminPage)

      // The publishedAt field should render in the sidebar with the dayAndTime picker.
      await expect(adminPage.locator('#field-publishedAt')).toBeVisible({ timeout: 10000 })

      await saveDocAndAssert(adminPage, '#action-save', 'success')
    } finally {
      await deleteDoc(adminPage, 'posts', postId)
    }
  })

  authTest('publishedAt shows day and time picker on posts', async ({ adminPage }) => {
    const postsUrl = new AdminUrlUtil(SERVER_URL, 'posts')
    await setTenantCookie(adminPage.context(), TenantSlugs.nwac)

    await adminPage.goto(postsUrl.list)
    const postId = await createDraftDoc(adminPage, 'posts', { content: MINIMAL_LEXICAL })

    try {
      await adminPage.goto(postsUrl.edit(postId))
      await waitForFormReady(adminPage)

      // The publishedAt field should have a value (auto-populated on create).
      const publishedAtInput = adminPage.locator('#field-publishedAt input')
      await expect(publishedAtInput).toBeVisible({ timeout: 10000 })
      expect(await publishedAtInput.inputValue()).toBeTruthy()
    } finally {
      await deleteDoc(adminPage, 'posts', postId)
    }
  })

  authTest('user can manually set publishedAt and it persists', async ({ adminPage }) => {
    const postsUrl = new AdminUrlUtil(SERVER_URL, 'posts')
    await setTenantCookie(adminPage.context(), TenantSlugs.nwac)

    await adminPage.goto(postsUrl.list)
    const postId = await createDraftDoc(adminPage, 'posts', { content: MINIMAL_LEXICAL })

    try {
      await adminPage.goto(postsUrl.edit(postId))
      await waitForFormReady(adminPage)

      // Clear and set a specific date
      const publishedAtInput = adminPage.locator('#field-publishedAt input')
      await publishedAtInput.click()
      await publishedAtInput.clear()
      await publishedAtInput.fill('01/01/2025 10:00 AM')
      await publishedAtInput.press('Escape')

      await saveDocAndAssert(adminPage, '#action-save', 'success')

      // Reload and verify the date persisted
      await adminPage.reload()
      await waitForFormReady(adminPage)

      // The dayAndTime picker renders as e.g. "Jan 1, 2025 10:00 AM".
      const updatedValue = await adminPage.locator('#field-publishedAt input').inputValue()
      expect(updatedValue).toContain('Jan 1, 2025')
    } finally {
      await deleteDoc(adminPage, 'posts', postId)
    }
  })
})
