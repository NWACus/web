import { authTest, expect } from '../../fixtures/auth.fixture'
import {
  AdminUrlUtil,
  CollectionSlugs,
  getSelectInputOptions,
  getSelectInputValue,
  isSelectReadOnly,
  openDocControls,
  selectInput,
  waitForFormReady,
} from '../../helpers'

const SERVER_URL = 'http://localhost:3000'
const tenantsUrl = new AdminUrlUtil(SERVER_URL, CollectionSlugs.tenants)

authTest.describe('Tenants', () => {
  authTest.describe('Create', () => {
    authTest.describe.configure({ timeout: 60000 })

    authTest('slug dropdown only shows unused slugs', async ({ adminPage }) => {
      await adminPage.goto(tenantsUrl.list)
      await adminPage.waitForLoadState('networkidle')

      await adminPage.goto(tenantsUrl.create)
      await adminPage.waitForLoadState('networkidle')
      await waitForFormReady(adminPage)

      const slugField = adminPage.locator('#field-slug')
      const options = await getSelectInputOptions({ selectLocator: slugField })

      expect(options).not.toContain(expect.stringMatching(/nwac/i))
      expect(options).not.toContain(expect.stringMatching(/dvac/i))
      expect(options).not.toContain(expect.stringMatching(/sac/i))
      expect(options).not.toContain(expect.stringMatching(/snfac/i))
    })

    authTest('selecting a slug auto-fills the name field', async ({ adminPage }) => {
      await adminPage.goto(tenantsUrl.create)
      await adminPage.waitForLoadState('networkidle')
      await waitForFormReady(adminPage)

      const slugField = adminPage.locator('#field-slug')
      const nameInput = adminPage.locator('#field-name')

      await expect(nameInput).toHaveValue('')

      const options = await getSelectInputOptions({ selectLocator: slugField })
      if (options.length === 0) {
        authTest.skip()
        return
      }

      await selectInput({ selectLocator: slugField, option: options[0] })

      await expect(nameInput).not.toHaveValue('', { timeout: 5000 })
    })
  })

  authTest.describe('Read', () => {
    authTest.describe.configure({ timeout: 60000 })

    authTest(
      'slug field shows current value and read-only on existing tenant',
      async ({ adminPage }) => {
        await adminPage.goto(tenantsUrl.list)
        await adminPage.waitForLoadState('networkidle')

        const firstLink = adminPage.locator('table tbody tr td a').first()
        await firstLink.waitFor({ timeout: 15000 })
        await firstLink.click()
        await adminPage.waitForURL(/\/collections\/tenants\/\d+/)
        await waitForFormReady(adminPage)

        const slugField = adminPage.locator('#field-slug')
        await expect(slugField).toBeVisible()

        const value = await getSelectInputValue({ selectLocator: slugField })
        expect(value).toBeTruthy()

        const readOnly = await isSelectReadOnly({ selectLocator: slugField })
        expect(readOnly).toBe(true)
      },
    )
  })

  authTest.describe('Delete', () => {
    authTest.describe.configure({ timeout: 90000 })

    authTest('shows custom confirmation modal with type-to-confirm', async ({ adminPage }) => {
      await adminPage.goto(tenantsUrl.list)
      await adminPage.waitForLoadState('networkidle')

      // Click the first tenant to open edit view
      const firstLink = adminPage.locator('table tbody tr td a').first()
      await firstLink.waitFor({ timeout: 15000 })
      await firstLink.click()
      await adminPage.waitForURL(/\/collections\/tenants\/\d+/)
      await waitForFormReady(adminPage)

      // Get the tenant name for verification
      const nameInput = adminPage.locator('#field-name')
      const tenantName = await nameInput.inputValue()

      // Open the doc controls dropdown and click Delete
      await openDocControls(adminPage)
      const deleteButton = adminPage.getByRole('button', { name: 'Delete', exact: true })
      await deleteButton.waitFor({ timeout: 5000 })
      await deleteButton.click()

      // The custom modal should appear (not Payload's default)
      const modal = adminPage.locator('.confirmation-modal')
      await expect(modal).toBeVisible({ timeout: 10000 })

      // Should show the tenant name in the heading
      await expect(modal.locator('h1')).toContainText(tenantName)

      // Should have a text input for typing the name
      const confirmInput = modal.locator('input[type="text"]')
      await expect(confirmInput).toBeVisible()

      // Should have a prompt to type the name
      await expect(modal).toContainText('Type')
      await expect(modal.getByText(tenantName, { exact: true })).toBeVisible()

      // Cancel to avoid actually deleting
      const cancelButton = modal.getByRole('button', { name: 'Cancel' })
      await cancelButton.click()

      // Modal should close
      await expect(modal).not.toBeVisible({ timeout: 5000 })
    })

    authTest('shows error when typing wrong name', async ({ adminPage }) => {
      await adminPage.goto(tenantsUrl.list)
      await adminPage.waitForLoadState('networkidle')

      const firstLink = adminPage.locator('table tbody tr td a').first()
      await firstLink.waitFor({ timeout: 15000 })
      await firstLink.click()
      await adminPage.waitForURL(/\/collections\/tenants\/\d+/)
      await waitForFormReady(adminPage)

      // Open delete modal
      await openDocControls(adminPage)
      const deleteButton = adminPage.getByRole('button', { name: 'Delete', exact: true })
      await deleteButton.waitFor({ timeout: 5000 })
      await deleteButton.click()

      const modal = adminPage.locator('.confirmation-modal')
      await expect(modal).toBeVisible({ timeout: 10000 })

      // Type wrong name
      const confirmInput = modal.locator('input[type="text"]')
      await confirmInput.fill('wrong name')

      // Click delete
      const confirmDelete = modal.getByRole('button', { name: 'Delete', exact: true })
      await confirmDelete.click()

      // Should show error toast
      await expect(
        adminPage.locator(
          '.toast-error, .Toastify__toast--error, [data-sonner-toast][data-type="error"]',
        ),
      ).toBeVisible({ timeout: 10000 })

      // Modal should still be open
      await expect(modal).toBeVisible()

      // Cancel to clean up
      const cancelButton = modal.getByRole('button', { name: 'Cancel' })
      await cancelButton.click()
    })
  })
})
