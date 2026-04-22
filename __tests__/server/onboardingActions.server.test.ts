// Covers the super-admin auth gate on the three provisioning server actions.
// The downstream work (payload.findByID, provision(), etc.) is intentionally
// not mocked because every code path here short-circuits before reaching it.

jest.mock('../../src/payload.config', () => ({}))

const mockAuth = jest.fn()
const mockGetPayload = jest.fn(() => ({
  auth: mockAuth,
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}))
jest.mock('payload', () => ({ getPayload: () => mockGetPayload() }))

const mockHeaders = jest.fn()
jest.mock('next/headers', () => ({ headers: () => mockHeaders() }))

const mockHasSuperAdmin = jest.fn()
jest.mock('../../src/access/hasSuperAdminPermissions', () => ({
  hasSuperAdminPermissions: (...args: unknown[]) => mockHasSuperAdmin(...args),
}))

// Stub external dependencies the actions happen to import at module load time.
jest.mock('../../src/app/api/[center]/og/centerColorMap', () => ({ centerColorMap: {} }))
jest.mock('../../src/utilities/isRecord', () => ({
  isRecord: (v: unknown) => typeof v === 'object' && v !== null,
}))
jest.mock('../../src/collections/Tenants/endpoints/provisionTenant', () => ({
  provision: jest.fn(),
  STALE_IN_PROGRESS_MS: 5 * 60 * 1000,
}))

import {
  checkProvisioningStatusAction,
  markProvisioningCompleteAction,
  runProvisionAction,
} from '@/collections/Tenants/components/onboardingActions'

describe('provisioning server action auth gate', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockHeaders.mockReturnValue(new Headers())
  })

  const actions = [
    { name: 'checkProvisioningStatusAction', run: () => checkProvisioningStatusAction(1) },
    { name: 'runProvisionAction', run: () => runProvisionAction(1) },
    { name: 'markProvisioningCompleteAction', run: () => markProvisioningCompleteAction(1) },
  ]

  describe.each(actions)('$name', ({ run }) => {
    it('returns Unauthorized when no user is authenticated', async () => {
      mockAuth.mockResolvedValue({ user: null })

      const result = await run()

      expect(result).toEqual({ error: 'Unauthorized' })
      expect(mockHasSuperAdmin).not.toHaveBeenCalled()
    })

    it('returns Super admin access required when user lacks the role', async () => {
      mockAuth.mockResolvedValue({ user: { id: 42 } })
      mockHasSuperAdmin.mockResolvedValue(false)

      const result = await run()

      expect(result).toEqual({ error: 'Super admin access required' })
    })

    it('proceeds past the auth gate for a super admin', async () => {
      mockAuth.mockResolvedValue({ user: { id: 42 } })
      mockHasSuperAdmin.mockResolvedValue(true)

      const result = await run()

      // We don't assert success — the payload mock doesn't implement findByID
      // etc. — only that the auth gate didn't short-circuit with Unauthorized
      // or the super-admin denial.
      expect(result).not.toEqual({ error: 'Unauthorized' })
      expect(result).not.toEqual({ error: 'Super admin access required' })
    })
  })
})
