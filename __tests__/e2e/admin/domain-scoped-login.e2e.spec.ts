import { authTest, expect } from '../fixtures/auth.fixture'
import { openNav } from '../fixtures/nav.fixture'
import { testUsers } from '../fixtures/test-users'
import { submitLoginForm, tenantBaseUrl } from '../helpers'

// validateDomainAccessBeforeLogin only runs when the login happens on a tenant
// domain, so admin/login.e2e.spec.ts (root domain) never reaches it. The
// middleware sets the payload-tenant cookie on the first /admin response, which
// is what tells the hook which tenant the domain belongs to.
const NWAC_ORIGIN = tenantBaseUrl('nwac')
const SAC_ORIGIN = tenantBaseUrl('sac')

authTest.describe('Domain-scoped login', () => {
  authTest.describe.configure({ timeout: 90000 })

  authTest('rejects a user scoped only to another tenant', async ({ page }) => {
    const user = testUsers.sacTenantAdmin

    await page.goto(`${NWAC_ORIGIN}/admin/login`)
    await submitLoginForm(page, user.email, user.password)

    await expect(page.locator('.toast-error')).toContainText(
      'not allowed to access AvyFx on this domain',
      { timeout: 15000 },
    )
    await expect(page).toHaveURL(/\/admin\/login/)

    // No session was issued
    const cookies = await page.context().cookies()
    expect(cookies.find((cookie) => cookie.name === 'payload-token')).toBeUndefined()
  })

  const allowed = [
    {
      label: 'a user scoped to the domain tenant',
      user: testUsers.singleTenantAdmin,
      origin: NWAC_ORIGIN,
    },
    {
      label: 'a global-role user on the nwac domain',
      user: testUsers.superAdmin,
      origin: NWAC_ORIGIN,
    },
    {
      label: 'a global-role user on the sac domain',
      user: testUsers.superAdmin,
      origin: SAC_ORIGIN,
    },
  ]

  for (const { label, user, origin } of allowed) {
    authTest(`allows ${label}`, async ({ loginWithCredentials }) => {
      const page = await loginWithCredentials(user.email, user.password, { origin })

      await openNav(page)
      await expect(page.getByRole('button', { name: 'Log out' })).toBeVisible({ timeout: 10000 })

      await page.context().close()
    })
  }
})
