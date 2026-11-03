jest.mock('../../src/payload.config', () => ({}))

const mockHasSuperAdminPermissions = jest.fn()
jest.mock('../../src/access/hasSuperAdminPermissions', () => ({
  hasSuperAdminPermissions: (...args: unknown[]) => mockHasSuperAdminPermissions(...args),
}))

const mockIsProviderManager = jest.fn()
jest.mock('../../src/utilities/rbac/isProviderManager', () => ({
  isProviderManager: (...args: unknown[]) => mockIsProviderManager(...args),
}))

import { courseTypesFieldAccess } from '@/collections/Providers/access/courseTypesFieldAccess'
import type { PayloadRequest } from 'payload'

function buildRequest(user: { id: number } | null): PayloadRequest {
  // @ts-expect-error - partial PayloadRequest; the access checks are mocked and read only user
  return { user, payload: {} }
}

describe('courseTypesFieldAccess (used by curriculum and courseTypes)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('read', () => {
    it('allows read for everyone', () => {
      expect(courseTypesFieldAccess.read()).toBe(true)
    })
  })

  describe('create / update', () => {
    it('denies when there is no user', async () => {
      const result = await courseTypesFieldAccess.create({ req: buildRequest(null) })
      expect(result).toBe(false)
    })

    it('allows super admins', async () => {
      mockHasSuperAdminPermissions.mockResolvedValue(true)
      const result = await courseTypesFieldAccess.create({ req: buildRequest({ id: 1 }) })
      expect(result).toBe(true)
    })

    it('allows provider managers', async () => {
      mockHasSuperAdminPermissions.mockResolvedValue(false)
      mockIsProviderManager.mockResolvedValue(true)
      const result = await courseTypesFieldAccess.create({ req: buildRequest({ id: 2 }) })
      expect(result).toBe(true)
    })

    it('denies regular users who are neither super admin nor provider manager', async () => {
      mockHasSuperAdminPermissions.mockResolvedValue(false)
      mockIsProviderManager.mockResolvedValue(false)
      const result = await courseTypesFieldAccess.update({ req: buildRequest({ id: 3 }) })
      expect(result).toBe(false)
    })
  })
})
