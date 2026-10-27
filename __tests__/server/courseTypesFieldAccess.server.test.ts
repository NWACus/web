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

const fakeReq = (user: unknown) =>
  ({ user, payload: {} }) as Parameters<typeof courseTypesFieldAccess.create>[0]['req']

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
      const result = await courseTypesFieldAccess.create({ req: fakeReq(null) } as never)
      expect(result).toBe(false)
    })

    it('allows super admins', async () => {
      mockHasSuperAdminPermissions.mockResolvedValue(true)
      const result = await courseTypesFieldAccess.create({
        req: fakeReq({ id: 1 }),
      } as never)
      expect(result).toBe(true)
    })

    it('allows provider managers', async () => {
      mockHasSuperAdminPermissions.mockResolvedValue(false)
      mockIsProviderManager.mockResolvedValue(true)
      const result = await courseTypesFieldAccess.create({
        req: fakeReq({ id: 2 }),
      } as never)
      expect(result).toBe(true)
    })

    it('denies regular users who are neither super admin nor provider manager', async () => {
      mockHasSuperAdminPermissions.mockResolvedValue(false)
      mockIsProviderManager.mockResolvedValue(false)
      const result = await courseTypesFieldAccess.update({
        req: fakeReq({ id: 3 }),
      } as never)
      expect(result).toBe(false)
    })
  })
})
