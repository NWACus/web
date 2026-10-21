// Covers the access gates on the invite server actions: the awaited create check, and that resend
// stays within users the caller can read and never hands an invite token back to the browser.

jest.mock('../../src/payload.config', () => ({}))

const mockAuth = jest.fn()
const mockFindByID = jest.fn()
const mockUpdate = jest.fn()
const mockCreate = jest.fn()
const mockPayload = {
  auth: mockAuth,
  findByID: mockFindByID,
  update: mockUpdate,
  create: mockCreate,
  config: { routes: { admin: '/admin' } },
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}
jest.mock('payload', () => ({
  getPayload: () => mockPayload,
  ValidationError: class ValidationError extends Error {},
}))
jest.mock('payload/shared', () => ({
  formatAdminURL: ({ path }: { path: string }) => `http://localhost:3000/admin${path}`,
}))

const mockHeaders = jest.fn()
jest.mock('next/headers', () => ({ headers: () => mockHeaders() }))

const mockCanInvite = jest.fn()
jest.mock('../../src/collections/Users/access/byGlobalRoleOrTenantRoleAssignmentOrDomain', () => ({
  byGlobalRoleOrTenantRoleAssignmentOrDomain: () => mockCanInvite,
}))

const mockSendEmail = jest.fn()
jest.mock('../../src/utilities/email/sendEmail', () => ({
  sendEmail: (...args: unknown[]) => mockSendEmail(...args),
}))
jest.mock('../../src/utilities/email/generateInviteUserEmail', () => ({
  generateInviteUserEmail: async () => ({ html: '', text: '', subject: 'Invite' }),
}))
jest.mock('../../src/utilities/getURL', () => ({ getURL: () => 'http://localhost:3000' }))
jest.mock('../../src/utilities/rbac/isProviderManager', () => ({ isProviderManager: jest.fn() }))
jest.mock('../../src/utilities/rbac/canManageProviders', () => ({ canManageProviders: jest.fn() }))
jest.mock('../../src/utilities/rbac/escalationCheck', () => ({
  canAssignRole: jest.fn(),
  canAssignGlobalRole: jest.fn(),
}))

import { inviteUserAction } from '@/collections/Users/components/inviteUserAction'
import {
  checkExpiredInviteAction,
  resendInviteAction,
} from '@/collections/Users/components/resendInviteActions'

const caller = { id: 10, collection: 'users', email: 'caller@avy.com' }
const pendingInvitee = {
  id: 20,
  email: 'invitee@avy.com',
  inviteToken: 'secret-invite-token',
  inviteExpiration: '2000-01-01T00:00:00.000Z',
}
const activeUser = { id: 30, email: 'admin@avy.com', inviteToken: null, inviteExpiration: null }

beforeEach(() => {
  mockHeaders.mockReturnValue(new Headers())
  mockAuth.mockResolvedValue({ user: caller })
  mockCanInvite.mockResolvedValue(true)
})

describe('invite create gate', () => {
  const actions = [
    {
      name: 'inviteUserAction',
      run: () =>
        inviteUserAction({
          email: 'new@avy.com',
          name: 'New User',
          roleAssignments: [],
          globalRoleAssignments: [],
        }),
    },
    { name: 'checkExpiredInviteAction', run: () => checkExpiredInviteAction('20') },
    { name: 'resendInviteAction', run: () => resendInviteAction('20') },
  ]

  describe.each(actions)('$name', ({ run }) => {
    it('denies a caller whose create access resolves to false', async () => {
      mockCanInvite.mockResolvedValue(false)

      const result = await run()

      expect(result).toMatchObject({ error: 'You are not allowed to perform that action.' })
      expect(mockFindByID).not.toHaveBeenCalled()
      expect(mockCreate).not.toHaveBeenCalled()
      expect(mockUpdate).not.toHaveBeenCalled()
    })

    it('denies an anonymous caller', async () => {
      mockAuth.mockResolvedValue({ user: null })

      const result = await run()

      expect(result).toMatchObject({ error: 'You are not allowed to perform that action.' })
      expect(mockCanInvite).not.toHaveBeenCalled()
    })
  })
})

describe('checkExpiredInviteAction', () => {
  it("loads the target with the caller's access", async () => {
    mockFindByID.mockResolvedValue(pendingInvitee)

    await checkExpiredInviteAction('20')

    expect(mockFindByID).toHaveBeenCalledWith(
      expect.objectContaining({ id: '20', overrideAccess: false, user: caller }),
    )
  })

  it('reports invite status without returning the token', async () => {
    mockFindByID.mockResolvedValue(pendingInvitee)

    const result = await checkExpiredInviteAction('20')

    expect(result).toEqual({ hasExpiredInvite: true, hasPendingInvite: true })
    expect(JSON.stringify(result)).not.toContain(pendingInvitee.inviteToken)
  })

  it('returns an error when the caller cannot read the target', async () => {
    mockFindByID.mockRejectedValue(new Error('Not Found'))

    const result = await checkExpiredInviteAction('30')

    expect(result).toEqual({ hasExpiredInvite: false, hasPendingInvite: false, error: 'Not Found' })
  })
})

describe('resendInviteAction', () => {
  it("loads the target with the caller's access", async () => {
    mockFindByID.mockResolvedValue(pendingInvitee)

    await resendInviteAction('20')

    expect(mockFindByID).toHaveBeenCalledWith(
      expect.objectContaining({ id: '20', overrideAccess: false, user: caller }),
    )
  })

  it('does not touch a user the caller cannot read', async () => {
    mockFindByID.mockRejectedValue(new Error('Not Found'))

    const result = await resendInviteAction('30')

    expect(result).toEqual({ success: false, error: 'Not Found' })
    expect(mockUpdate).not.toHaveBeenCalled()
    expect(mockSendEmail).not.toHaveBeenCalled()
  })

  it('refuses to issue an invite token to a user who already accepted', async () => {
    mockFindByID.mockResolvedValue(activeUser)

    const result = await resendInviteAction('30')

    expect(result).toEqual({
      success: false,
      error: 'This user has already accepted their invite.',
    })
    expect(mockUpdate).not.toHaveBeenCalled()
    expect(mockSendEmail).not.toHaveBeenCalled()
  })

  it('rotates the token and emails a pending invitee', async () => {
    mockFindByID.mockResolvedValue(pendingInvitee)

    const result = await resendInviteAction('20')

    expect(result).toEqual({ success: true })
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        id: '20',
        data: expect.objectContaining({ inviteToken: expect.not.stringMatching(/^secret/) }),
      }),
    )
    expect(mockSendEmail).toHaveBeenCalledWith(
      expect.objectContaining({ to: pendingInvitee.email }),
    )
  })
})
