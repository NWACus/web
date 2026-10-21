jest.mock('../../src/payload.config', () => ({}))
jest.mock('../../src/utilities/getDocumentById', () => ({ getDocumentById: jest.fn() }))

const mockIsProviderManager = jest.fn()
jest.mock('../../src/utilities/rbac/isProviderManager', () => ({
  isProviderManager: (...args: unknown[]) => mockIsProviderManager(...args),
}))

import { byGlobalRoleOrTenantRoleAssignmentOrDomain } from '@/collections/Users/access/byGlobalRoleOrTenantRoleAssignmentOrDomain'
import { User } from '@/payload-types'
import type { PayloadRequest } from 'payload'

const timestamps = { createdAt: '2026-10-20T00:00:00.000Z', updatedAt: '2026-10-20T00:00:00.000Z' }

// Matches the seeded Provider Manager role: providers only, no users rule
const providerManager: User = {
  id: 1,
  name: 'Provider Manager',
  email: 'provider-manager@avy.com',
  collection: 'users',
  globalRoleAssignments: {
    docs: [
      {
        id: 1,
        globalRole: {
          id: 1,
          name: 'Provider Manager',
          rules: [{ collections: ['providers'], actions: ['*'] }],
          ...timestamps,
        },
        ...timestamps,
      },
    ],
  },
  ...timestamps,
}

const userWithoutRoles: User = {
  id: 2,
  name: 'No Roles',
  email: 'nobody@avy.com',
  collection: 'users',
  ...timestamps,
}

function buildRequest(user: User): PayloadRequest {
  // @ts-expect-error - partial PayloadRequest; this access function reads only user and payload.logger
  return { user, payload: { logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() } } }
}

describe('byGlobalRoleOrTenantRoleAssignmentOrDomain create', () => {
  it('lets a provider manager invite without a users rule', async () => {
    mockIsProviderManager.mockResolvedValue(true)

    const canCreate = await byGlobalRoleOrTenantRoleAssignmentOrDomain('create')({
      req: buildRequest(providerManager),
    })

    expect(canCreate).toBe(true)
  })

  it('denies a user with no global role, tenant role or provider manager role', async () => {
    mockIsProviderManager.mockResolvedValue(false)

    const canCreate = await byGlobalRoleOrTenantRoleAssignmentOrDomain('create')({
      req: buildRequest(userWithoutRoles),
    })

    expect(canCreate).toBe(false)
  })

  it('does not extend the provider manager bypass to delete', async () => {
    mockIsProviderManager.mockResolvedValue(true)

    const canDelete = await byGlobalRoleOrTenantRoleAssignmentOrDomain('delete')({
      req: buildRequest(providerManager),
    })

    expect(canDelete).toBe(false)
  })
})
