import type { Page } from '@playwright/test'
import { authTest, expect } from '../../fixtures/auth.fixture'
import { testUsers, type UserRole } from '../../fixtures/test-users'
import { TenantIds, TenantSlugs, apiRequest, setTenantCookie } from '../../helpers'

// Escalation checks live in beforeValidate hooks that are skipped for the Local
// API (so seeding can bootstrap roles), so they must be exercised over REST or
// the admin UI. These run the same REST calls the admin UI makes.

async function findId(page: Page, path: string): Promise<number> {
  const result = await apiRequest(page, path)
  expect(result.ok, `${path} failed (${result.status})`).toBeTruthy()
  const id = result.body.docs[0]?.id
  expect(id, `no document matched ${path}`).toBeTruthy()
  return id
}

async function countAssignments(page: Page, userId: number): Promise<number> {
  const result = await apiRequest(
    page,
    `/api/roleAssignments?where[user][equals]=${userId}&limit=1&depth=0`,
  )
  return result.body.totalDocs
}

/** POSTs as the NWAC admin with NWAC selected, the way the admin UI would. */
async function createAsNwacAdmin(
  loginAs: (role: UserRole) => Promise<Page>,
  path: string,
  body: unknown,
) {
  const page = await loginAs('singleTenantAdmin')
  await setTenantCookie(page.context(), TenantSlugs.nwac)
  await page.goto('/admin')
  const result = await apiRequest(page, path, { method: 'POST', body })
  await page.context().close()
  return result
}

async function expectEscalationRefused(
  result: Awaited<ReturnType<typeof apiRequest>>,
  message: string,
) {
  expect(result.status, message).toBe(400)
  expect(JSON.stringify(result.body), message).toContain('cannot assign the role')
}

authTest.describe('Role assignment escalation protection', () => {
  authTest.describe.configure({ timeout: 90000 })

  let adminRoleId: number
  let forecasterRoleId: number
  let nwacStaffId: number
  let sacStaffId: number

  authTest.beforeEach(async ({ adminPage }) => {
    await adminPage.goto('/admin')
    adminRoleId = await findId(adminPage, '/api/roles?where[name][equals]=Admin&depth=0')
    forecasterRoleId = await findId(adminPage, '/api/roles?where[name][equals]=Forecaster&depth=0')
    nwacStaffId = await findId(
      adminPage,
      `/api/users?where[email][equals]=${testUsers.singleTenantStaff.email}&depth=0`,
    )
    sacStaffId = await findId(
      adminPage,
      '/api/users?where[email][equals]=staff@sierraavalanchecenter.org&depth=0',
    )
  })

  authTest(
    'a tenant admin can assign a role within their own tenant',
    async ({ loginAs, adminPage }) => {
      // Positive control: proves the refusals below are not a generic failure
      const created = await createAsNwacAdmin(loginAs, '/api/roleAssignments', {
        tenant: Number(TenantIds.nwac),
        role: forecasterRoleId,
        user: nwacStaffId,
      })
      expect(created.status, JSON.stringify(created.body)).toBe(201)

      await apiRequest(adminPage, `/api/roleAssignments/${created.body.doc.id}`, {
        method: 'DELETE',
      })
    },
  )

  authTest(
    'a tenant admin cannot assign a role in a tenant they do not administer',
    async ({ loginAs, adminPage }) => {
      const before = await countAssignments(adminPage, sacStaffId)

      const result = await createAsNwacAdmin(loginAs, '/api/roleAssignments', {
        tenant: Number(TenantIds.sac),
        role: adminRoleId,
        user: sacStaffId,
      })
      await expectEscalationRefused(result, 'assigning Admin in SAC as the NWAC admin')

      expect(await countAssignments(adminPage, sacStaffId)).toBe(before)
    },
  )

  authTest(
    'a tenant admin cannot assign a role with permissions above their own',
    async ({ loginAs, adminPage }) => {
      // A role broader than the seeded Admin role (which has no `*` collection rule)
      const everything = await apiRequest(adminPage, '/api/roles', {
        method: 'POST',
        body: {
          name: `E2E everything ${Date.now()}`,
          rules: [{ collections: ['*'], actions: ['*'] }],
        },
      })
      expect(everything.status, JSON.stringify(everything.body)).toBe(201)
      const everythingRoleId = everything.body.doc.id

      try {
        const before = await countAssignments(adminPage, nwacStaffId)

        const result = await createAsNwacAdmin(loginAs, '/api/roleAssignments', {
          tenant: Number(TenantIds.nwac),
          role: everythingRoleId,
          user: nwacStaffId,
        })
        await expectEscalationRefused(result, 'assigning a broader role as the NWAC admin')

        expect(await countAssignments(adminPage, nwacStaffId)).toBe(before)
      } finally {
        await apiRequest(adminPage, `/api/roles/${everythingRoleId}`, { method: 'DELETE' })
      }
    },
  )

  authTest('a tenant admin cannot grant a global role', async ({ loginAs, adminPage }) => {
    const superAdminRoleId = await findId(
      adminPage,
      '/api/globalRoles?where[name][equals]=Super Admin&depth=0',
    )

    const result = await createAsNwacAdmin(loginAs, '/api/globalRoleAssignments', {
      globalRole: superAdminRoleId,
      user: nwacStaffId,
    })
    expect(result.status, JSON.stringify(result.body)).toBe(403)

    const assignments = await apiRequest(
      adminPage,
      `/api/globalRoleAssignments?where[user][equals]=${nwacStaffId}&limit=1&depth=0`,
    )
    expect(assignments.body.totalDocs).toBe(0)
  })
})
