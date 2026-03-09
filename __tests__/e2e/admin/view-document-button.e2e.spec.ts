import { authTest, expect } from '../fixtures/auth.fixture'
import { AdminUrlUtil } from '../helpers/admin-url'
import { saveDocAndAssert } from '../helpers/save-doc'
import { setTenantCookie, TenantIds } from '../helpers/tenant-cookie'

const SERVER_URL = 'http://localhost:3000'

authTest.describe('ViewDocumentButton on published documents', () => {
  authTest.describe.configure({ timeout: 60000 })

  authTest('shows live document button on a published post', async ({ adminPage }) => {
    const postsUrl = new AdminUrlUtil(SERVER_URL, 'posts')

    await setTenantCookie(adminPage.context(), TenantIds.nwac)
    await adminPage.goto(`${postsUrl.list}?where[_status][equals]=published`)

    // Use the first published post
    const firstLink = adminPage.locator('table tbody tr td a').first()
    await firstLink.waitFor({ timeout: 15000 })
    await firstLink.click()

    // Wait for the document edit view to load
    await adminPage.waitForURL(/\/collections\/posts\/\d+/)

    // The live document button should be visible for published posts
    await expect(adminPage.locator('#view-document-button')).toBeVisible({ timeout: 10000 })
  })

  authTest('shows live document button on a published page', async ({ adminPage }) => {
    const pagesUrl = new AdminUrlUtil(SERVER_URL, 'pages')

    await setTenantCookie(adminPage.context(), TenantIds.nwac)
    await adminPage.goto(`${pagesUrl.list}?where[_status][equals]=published`)

    // Use the first published post
    const firstLink = adminPage.locator('table tbody tr td a').first()
    await firstLink.waitFor({ timeout: 15000 })
    await firstLink.click()

    await adminPage.waitForURL(/\/collections\/pages\/\d+/)

    await expect(adminPage.locator('#view-document-button')).toBeVisible({ timeout: 10000 })
  })
})

authTest.describe('ViewDocumentButton hidden on draft documents', () => {
  authTest.describe.configure({ mode: 'serial', timeout: 90000 })

  authTest(
    'hides live document button on a draft post, then re-publishes',
    async ({ adminPage }) => {
      const postsUrl = new AdminUrlUtil(SERVER_URL, 'posts')

      await setTenantCookie(adminPage.context(), TenantIds.nwac)
      await adminPage.goto(`${postsUrl.list}?where[_status][equals]=published`)

      // Use the first published post
      const firstLink = adminPage.locator('table tbody tr td a').first()
      await firstLink.waitFor({ timeout: 15000 })
      await firstLink.click()
      await adminPage.waitForURL(/\/collections\/posts\/\d+/)

      await expect(adminPage.locator('#view-document-button')).toBeVisible({ timeout: 10000 })

      // Unpublish: open the doc controls popup (three dots menu) and click unpublish
      await adminPage.locator('.doc-controls__popup .popup-button').click()
      // Popup content is portaled to body, so use a global selector
      const unpublishButton = adminPage.getByRole('button', { name: 'Unpublish', exact: true })
      await unpublishButton.waitFor({ timeout: 5000 })
      await unpublishButton.click()

      await adminPage.locator('#confirm-action').click()

      // Wait for the unpublish success toast
      await expect(
        adminPage.locator(
          '.toast-success, .Toastify__toast--success, [data-sonner-toast][data-type="success"]',
        ),
      ).toBeVisible({ timeout: 10000 })

      // Reload to get the server-rendered state (button is server-side rendered)
      await adminPage.reload()
      await adminPage.waitForLoadState('networkidle')

      await expect(adminPage.locator('#view-document-button')).not.toBeVisible({ timeout: 10000 })

      // Re-publish the post to restore original state
      await saveDocAndAssert(adminPage, '#action-save')
    },
  )

  authTest(
    'hides live document button on a draft page, then re-publishes',
    async ({ adminPage }) => {
      const pagesUrl = new AdminUrlUtil(SERVER_URL, 'pages')

      await setTenantCookie(adminPage.context(), TenantIds.nwac)
      await adminPage.goto(`${pagesUrl.list}?where[_status][equals]=published`)

      // Use the first published post
      const firstLink = adminPage.locator('table tbody tr td a').first()
      await firstLink.waitFor({ timeout: 15000 })
      await firstLink.click()
      await adminPage.waitForURL(/\/collections\/pages\/\d+/)

      await expect(adminPage.locator('#view-document-button')).toBeVisible({ timeout: 10000 })

      // Unpublish: open the doc controls popup (three dots menu) and click unpublish
      await adminPage.locator('.doc-controls__popup .popup-button').click()
      // Popup content is portaled to body, so use a global selector
      const unpublishButton = adminPage.getByRole('button', { name: 'Unpublish', exact: true })
      await unpublishButton.waitFor({ timeout: 5000 })
      await unpublishButton.click()

      await adminPage.locator('#confirm-action').click()

      await expect(
        adminPage.locator(
          '.toast-success, .Toastify__toast--success, [data-sonner-toast][data-type="success"]',
        ),
      ).toBeVisible({ timeout: 10000 })

      // Reload to get the server-rendered state (button is server-side rendered)
      await adminPage.reload()
      await adminPage.waitForLoadState('networkidle')

      await expect(adminPage.locator('#view-document-button')).not.toBeVisible({ timeout: 10000 })

      // Re-publish the page to restore original state
      await saveDocAndAssert(adminPage, '#action-save')
    },
  )
})
