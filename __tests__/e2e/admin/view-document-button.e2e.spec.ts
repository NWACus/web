import { authTest, expect } from '../fixtures/auth.fixture'
import { AdminUrlUtil } from '../helpers/admin-url'
import { saveDocAndAssert } from '../helpers/save-doc'
import { setTenantCookie, TenantSlugs } from '../helpers/tenant-cookie'

const SERVER_URL = 'http://localhost:3000'

authTest.describe('ViewDocumentButton on published documents', () => {
  authTest.describe.configure({ timeout: 60000 })

  authTest('shows live document button on a published post', async ({ adminPage }) => {
    const postsUrl = new AdminUrlUtil(SERVER_URL, 'posts')

    await setTenantCookie(adminPage.context(), TenantSlugs.nwac)
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

    await setTenantCookie(adminPage.context(), TenantSlugs.nwac)
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

  // Track the document URL so afterEach can re-publish even if the test fails
  let unpublishedDocUrl: string | null = null

  authTest.afterEach(async ({ adminPage }) => {
    if (unpublishedDocUrl) {
      await adminPage.goto(unpublishedDocUrl)
      await adminPage.waitForLoadState('networkidle')
      await saveDocAndAssert(adminPage, '#action-save')
      unpublishedDocUrl = null
    }
  })

  authTest('hides live document button on a draft post', async ({ adminPage }) => {
    const postsUrl = new AdminUrlUtil(SERVER_URL, 'posts')

    await setTenantCookie(adminPage.context(), TenantSlugs.nwac)
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

    // Store the URL so afterEach can re-publish if we fail below
    unpublishedDocUrl = adminPage.url()

    // Wait for the unpublish success toast
    await expect(
      adminPage.locator(
        '.toast-success, .Toastify__toast--success, [data-sonner-toast][data-type="success"]',
      ),
    ).toBeVisible({ timeout: 15000 })

    // Reload to get the server-rendered state (button is server-side rendered)
    await adminPage.reload()
    await adminPage.waitForLoadState('networkidle')

    await expect(adminPage.locator('#view-document-button')).not.toBeVisible({ timeout: 10000 })
  })

  authTest('hides live document button on a draft page', async ({ adminPage }) => {
    const pagesUrl = new AdminUrlUtil(SERVER_URL, 'pages')

    await setTenantCookie(adminPage.context(), TenantSlugs.nwac)
    await adminPage.goto(`${pagesUrl.list}?where[_status][equals]=published`)

    // Use the first published page
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

    // Store the URL so afterEach can re-publish if we fail below
    unpublishedDocUrl = adminPage.url()

    await expect(
      adminPage.locator(
        '.toast-success, .Toastify__toast--success, [data-sonner-toast][data-type="success"]',
      ),
    ).toBeVisible({ timeout: 15000 })

    // Reload to get the server-rendered state (button is server-side rendered)
    await adminPage.reload()
    await adminPage.waitForLoadState('networkidle')

    await expect(adminPage.locator('#view-document-button')).not.toBeVisible({ timeout: 10000 })
  })
})
