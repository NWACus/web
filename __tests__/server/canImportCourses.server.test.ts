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

// @ts-expect-error -- canImportCourses only passes payload through to the mocked checks
const payload: Payload = {}
// @ts-expect-error -- only the identity matters to the mocked checks
const user: User = { id: 1, email: 'someone@example.org' }

describe('canImportCourses', () => {
  beforeEach(() => {
    mockIsProviderManager.mockReset()
    mockHasSuperAdminPermissions.mockReset()
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
