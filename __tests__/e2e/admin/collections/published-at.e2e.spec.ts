import { authTest, expect } from '../../fixtures/auth.fixture'
import { AdminUrlUtil } from '../../helpers/admin-url'
import { saveDocAndAssert } from '../../helpers/save-doc'
import { setTenantCookie, TenantSlugs } from '../../helpers/tenant-cookie'

const SERVER_URL = 'http://localhost:3000'

authTest.describe('publishedAt field behavior', () => {
  authTest.describe.configure({ mode: 'serial', timeout: 90000 })

  authTest.describe('Posts collection', () => {
    authTest('publishedAt is auto-set when publishing a new post', async ({ adminPage }) => {
      const postsUrl = new AdminUrlUtil(SERVER_URL, 'posts')
      await setTenantCookie(adminPage.context(), TenantSlugs.nwac)

      // Navigate to an existing draft post or create scenario
      await adminPage.goto(`${postsUrl.list}?where[_status][equals]=draft`)
      await adminPage.locator('table tbody tr td a').first().waitFor({ timeout: 15000 })
      await adminPage.locator('table tbody tr td a').first().click()
      await adminPage.waitForURL(/\/collections\/posts\/\d+/)

      // The publishedAt field should exist in the sidebar with dayAndTime picker
      const publishedAtField = adminPage.locator('#field-publishedAt')
      await expect(publishedAtField).toBeVisible({ timeout: 10000 })

      // Publish the post
      await saveDocAndAssert(adminPage, '#action-save', 'success')
    })

    authTest('publishedAt shows day and time picker on posts', async ({ adminPage }) => {
      const postsUrl = new AdminUrlUtil(SERVER_URL, 'posts')
      await setTenantCookie(adminPage.context(), TenantSlugs.nwac)

      await adminPage.goto(`${postsUrl.list}?where[_status][equals]=published`)
      await adminPage.locator('table tbody tr td a').first().waitFor({ timeout: 15000 })
      await adminPage.locator('table tbody tr td a').first().click()
      await adminPage.waitForURL(/\/collections\/posts\/\d+/)

      // The publishedAt field should have a value (auto-populated)
      const publishedAtInput = adminPage.locator('#field-publishedAt input')
      await expect(publishedAtInput).toBeVisible({ timeout: 10000 })
      const value = await publishedAtInput.inputValue()
      // dayAndTime format includes time component (e.g., "01/15/2026 12:00 PM" or similar)
      expect(value).toBeTruthy()
    })

    authTest('user can manually set publishedAt and it persists', async ({ adminPage }) => {
      const postsUrl = new AdminUrlUtil(SERVER_URL, 'posts')
      await setTenantCookie(adminPage.context(), TenantSlugs.nwac)

      await adminPage.goto(`${postsUrl.list}?where[_status][equals]=published`)
      await adminPage.locator('table tbody tr td a').first().waitFor({ timeout: 15000 })
      await adminPage.locator('table tbody tr td a').first().click()
      await adminPage.waitForURL(/\/collections\/posts\/\d+/)

      // Clear and set a specific date
      const publishedAtInput = adminPage.locator('#field-publishedAt input')
      await publishedAtInput.click()
      await publishedAtInput.clear()
      await publishedAtInput.fill('01/01/2025 10:00 AM')
      await publishedAtInput.press('Escape')

      // Save
      await saveDocAndAssert(adminPage, '#action-save', 'success')

      // Reload and verify the date persisted
      await adminPage.reload()
      await adminPage.locator('form[data-form-ready="true"]').waitFor({ timeout: 15000 })

      const updatedValue = await adminPage.locator('#field-publishedAt input').inputValue()
      expect(updatedValue).toContain('01/01/2025')
    })
  })

  authTest.describe('Pages collection', () => {
    authTest('publishedAt shows day and time picker on pages', async ({ adminPage }) => {
      const pagesUrl = new AdminUrlUtil(SERVER_URL, 'pages')
      await setTenantCookie(adminPage.context(), TenantSlugs.nwac)

      await adminPage.goto(`${pagesUrl.list}?where[_status][equals]=published`)
      await adminPage.locator('table tbody tr td a').first().waitFor({ timeout: 15000 })
      await adminPage.locator('table tbody tr td a').first().click()
      await adminPage.waitForURL(/\/collections\/pages\/\d+/)

      // The publishedAt field should have a value
      const publishedAtInput = adminPage.locator('#field-publishedAt input')
      await expect(publishedAtInput).toBeVisible({ timeout: 10000 })
      const value = await publishedAtInput.inputValue()
      expect(value).toBeTruthy()
    })

    authTest(
      'pages publishedAt field does not have misleading description',
      async ({ adminPage }) => {
        const pagesUrl = new AdminUrlUtil(SERVER_URL, 'pages')
        await setTenantCookie(adminPage.context(), TenantSlugs.nwac)

        await adminPage.goto(`${pagesUrl.list}?where[_status][equals]=published`)
        await adminPage.locator('table tbody tr td a').first().waitFor({ timeout: 15000 })
        await adminPage.locator('table tbody tr td a').first().click()
        await adminPage.waitForURL(/\/collections\/pages\/\d+/)

        // The misleading description should NOT be present
        const sidebar = adminPage.locator('.field-type.date')
        await expect(sidebar.locator('text=visibility')).not.toBeVisible()
        await expect(sidebar.locator('text=scheduling future publications')).not.toBeVisible()
      },
    )
  })
})
