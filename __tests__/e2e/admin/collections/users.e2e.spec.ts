import { authTest, expect } from '../../fixtures/auth.fixture'
import { AdminUrlUtil, CollectionSlugs } from '../../helpers'

const SERVER_URL = 'http://localhost:3000'
const usersUrl = new AdminUrlUtil(SERVER_URL, CollectionSlugs.users)

authTest.describe('Users: invite', () => {
  authTest.describe.configure({ timeout: 60000 })

  // Regression for #1415: Payload 3.90 stripped the provider manager's own globalRoleAssignments
  // from the admin view's user, so every global-role check failed and the button disappeared.
  authTest('provider manager can open the provider-only invite form', async ({ loginAs }) => {
    const page = await loginAs('providerManager')
    await page.goto(usersUrl.list)

    const inviteButton = page.getByRole('button', { name: 'Invite New User', exact: true })
    await expect(inviteButton).toBeVisible({ timeout: 15000 })
    await expect(page.getByText('You are not allowed to invite users')).not.toBeVisible()

    await inviteButton.click()
    const drawer = page.locator('.payload__modal-item--slug-invite-user-drawer')
    await expect(drawer.locator('label', { hasText: 'Providers' })).toBeVisible()
    await expect(drawer.getByRole('button', { name: 'Add Role Assignment' })).not.toBeVisible()
  })

  authTest('super admin sees the invite button', async ({ adminPage }) => {
    await adminPage.goto(usersUrl.list)
    await expect(
      adminPage.getByRole('button', { name: 'Invite New User', exact: true }),
    ).toBeVisible({
      timeout: 15000,
    })
  })

  authTest('provider user without users create sees no invite button', async ({ loginAs }) => {
    const page = await loginAs('providerUser')
    await page.goto(usersUrl.list)
    await expect(page.locator('.collection-list__header, h1').first()).toBeVisible({
      timeout: 15000,
    })
    await expect(
      page.getByRole('button', { name: 'Invite New User', exact: true }),
    ).not.toBeVisible()
  })
})
