const mockIsProviderManager = jest.fn()
const mockHasSuperAdminPermissions = jest.fn()

jest.mock('../../src/utilities/rbac/isProviderManager', () => ({
  isProviderManager: (...args: unknown[]) => mockIsProviderManager(...args),
}))
jest.mock('../../src/access/hasSuperAdminPermissions', () => ({
  hasSuperAdminPermissions: (...args: unknown[]) => mockHasSuperAdminPermissions(...args),
}))
jest.mock('payload', () => ({
  createLocalReq: async ({ user }: { user: unknown }, payload: unknown) => ({ user, payload }),
}))

import type { User } from '@/payload-types'
import { canImportCourses } from '@/utilities/rbac/canImportCourses'
import type { Payload } from 'payload'

const mockFind = jest.fn()
// @ts-expect-error -- canImportCourses only calls find; the role checks are mocked
const payload: Payload = { find: mockFind }
// @ts-expect-error -- only the identity matters to the mocked checks
const user: User = { id: 1, email: 'someone@example.org' }

describe('canImportCourses', () => {
  beforeEach(() => {
    mockIsProviderManager.mockReset()
    mockHasSuperAdminPermissions.mockReset()
    mockFind.mockReset().mockResolvedValue({ docs: [{ id: 3, globalRole: 2 }] })
  })

  it('checks roles loaded for the user, not ones field access may have stripped', async () => {
    mockIsProviderManager.mockResolvedValue(true)
    await canImportCourses(payload, user)
    expect(mockFind).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'globalRoleAssignments',
        where: { user: { equals: 1 } },
      }),
    )
    expect(mockIsProviderManager.mock.calls[0][1].globalRoleAssignments).toEqual({
      docs: [{ id: 3, globalRole: 2 }],
    })
  })

  it('allows a Provider Manager', async () => {
    mockIsProviderManager.mockResolvedValue(true)
    await expect(canImportCourses(payload, user)).resolves.toBe(true)
    expect(mockHasSuperAdminPermissions).not.toHaveBeenCalled()
  })

  it('allows a Super Admin', async () => {
    mockIsProviderManager.mockResolvedValue(false)
    mockHasSuperAdminPermissions.mockResolvedValue(true)
    await expect(canImportCourses(payload, user)).resolves.toBe(true)
  })

  it('refuses everyone else, such as Provider Users and Tenant Role Users', async () => {
    mockIsProviderManager.mockResolvedValue(false)
    mockHasSuperAdminPermissions.mockResolvedValue(false)
    await expect(canImportCourses(payload, user)).resolves.toBe(false)
  })
})
