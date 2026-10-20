import { authTest, expect } from '../../fixtures/auth.fixture'
import type { UserRole } from '../../fixtures/test-users'
import { AdminUrlUtil, apiRequest, CollectionSlugs, deleteDoc } from '../../helpers'

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
    await expect(page.getByText('You are not allowed to invite users')).toHaveCount(0)

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

  // No seeded user can list users without also being able to invite, so this covers the no-access case
  authTest(
    'provider user cannot reach the Users list or its invite button',
    async ({ loginAs }) => {
      const page = await loginAs('providerUser')
      await page.goto(usersUrl.list)
      await expect(page.getByRole('heading', { name: 'Nothing found' })).toBeVisible({
        timeout: 15000,
      })
      await expect(page.getByRole('button', { name: 'Invite New User', exact: true })).toHaveCount(
        0,
      )
    },
  )
})

authTest.describe('Users: resend invite', () => {
  authTest.describe.configure({ timeout: 90000 })

  // Resend loads the invitee with the caller's own read access, so it must still reach a
  // pending invitee in the caller's center and must not reach one outside it.
  authTest(
    'tenant admin can resend an invite only for users they can read',
    async ({ adminPage, loginAs }) => {
      const inviteeEmail = `e2e-resend-${Date.now()}@nwac.us`
      let inviteeId: number | undefined

      try {
        const page = await loginAs('singleTenantAdmin')
        await page.goto(usersUrl.list)
        await page.getByRole('button', { name: 'Invite New User', exact: true }).click()
        const drawer = page.locator('.payload__modal-item--slug-invite-user-drawer')
        await drawer.getByLabel('Email').fill(inviteeEmail)
        await drawer.getByLabel('Name').fill('E2E Resend Invitee')
        await drawer.getByRole('button', { name: 'Invite User' }).click()
        await expect(page.getByText(`Invite sent to: ${inviteeEmail}`)).toBeVisible()

        await adminPage.goto(usersUrl.list)
        const found = await apiRequest(
          adminPage,
          `/api/users?where[email][equals]=${encodeURIComponent(inviteeEmail)}&depth=0`,
        )
        inviteeId = found.body.docs?.[0]?.id
        if (inviteeId === undefined) {
          throw new Error(`Invitee ${inviteeEmail} was not created`)
        }

        await page.goto(usersUrl.edit(inviteeId))
        await expect(page.getByText('Invited', { exact: true })).toBeVisible()
        // Retries because Mailtrap's free tier (local SMTP) rate-limits the email right after the invite.
        // Reading the toast text means a real failure surfaces the server's error message.
        await expect(async () => {
          await page.getByRole('button', { name: 'Resend Invite' }).click()
          await expect(page.locator('li[data-sonner-toast]').last()).toContainText(
            'Invite resent successfully',
          )
        }).toPass({ timeout: 45000, intervals: [3000, 5000, 10000] })

        const ownRead = await apiRequest(page, `/api/users/${inviteeId}?depth=0`)
        expect(ownRead.ok, 'the inviting tenant admin should be able to read the invitee').toBe(
          true,
        )

        const outsiders: UserRole[] = ['sacTenantAdmin', 'providerManager']
        for (const role of outsiders) {
          const outsider = await loginAs(role)
          await outsider.goto(usersUrl.list)
          const res = await apiRequest(outsider, `/api/users/${inviteeId}?depth=0`)
          expect(res.ok, `${role} should not be able to read the invitee`).toBe(false)
          await outsider.context().close()
        }
      } finally {
        if (inviteeId !== undefined) {
          await deleteDoc(adminPage, 'users', inviteeId)
        }
      }
    },
  )
})
