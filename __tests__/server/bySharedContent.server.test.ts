import { accessBySharedContent } from '@/access/bySharedContent'
import {
  GlobalRole,
  GlobalRoleAssignment,
  Role,
  RoleAssignment,
  Tenant,
  User,
} from '@/payload-types'
import type { PayloadRequest } from 'payload'
import { Logger } from 'pino'

// 'media' stands in for a shared collection: the helpers are generic over the slug and
// sharedMedia does not exist yet.
const COLLECTION = 'media'

const access = accessBySharedContent(COLLECTION)

const timestamps = { createdAt: '2026-09-21T00:00:00.000Z', updatedAt: '2026-09-21T00:00:00.000Z' }

function buildMockLogger(): jest.Mocked<Logger> {
  // @ts-expect-error - partial mock of pino Logger; only methods used in tests are provided
  return {
    warn: jest.fn(),
    info: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  }
}

function buildRequest(user: User | null): PayloadRequest {
  // @ts-expect-error - partial PayloadRequest; these access functions read only user and payload.logger
  return { user, payload: { logger: buildMockLogger() } }
}

const tenant: Tenant = {
  id: 1,
  slug: 'nwac',
  name: 'Northwest Avalanche Center',
  provisioning: { status: 'complete' },
  ...timestamps,
}

function roleAssignment(rules: Role['rules']): RoleAssignment {
  return {
    id: 1,
    tenant,
    role: { id: 1, name: 'Editor', rules, ...timestamps },
    ...timestamps,
  }
}

function globalRoleAssignment(name: string, rules: GlobalRole['rules']): GlobalRoleAssignment {
  return {
    id: 1,
    globalRole: { id: 1, name, rules, ...timestamps },
    ...timestamps,
  }
}

function buildUser({
  roleAssignments = [],
  globalRoleAssignments = [],
  providers = [],
}: {
  roleAssignments?: RoleAssignment[]
  globalRoleAssignments?: GlobalRoleAssignment[]
  providers?: number[]
}): User {
  return {
    id: 1,
    name: 'Test User',
    email: 'test@avy.com',
    collection: 'users',
    roles: { docs: roleAssignments },
    globalRoleAssignments: { docs: globalRoleAssignments },
    providers,
    ...timestamps,
  }
}

type Outcome = { create: boolean; read: boolean; update: boolean; delete: boolean }

const NOTHING: Outcome = { create: false, read: false, update: false, delete: false }
const READ_ONLY: Outcome = { create: false, read: true, update: false, delete: false }
const EVERYTHING: Outcome = { create: true, read: true, update: true, delete: true }

async function outcomeFor(user: User | null): Promise<Outcome> {
  const req = buildRequest(user)
  const check = async (method: keyof Outcome): Promise<boolean> => {
    const fn = access?.[method]
    return fn ? (await fn({ req })) === true : false
  }
  return {
    create: await check('create'),
    read: await check('read'),
    update: await check('update'),
    delete: await check('delete'),
  }
}

describe('accessBySharedContent', () => {
  it('denies everything to an anonymous request', async () => {
    await expect(outcomeFor(null)).resolves.toEqual(NOTHING)
  })

  it('denies everything to a Provider User with no roles', async () => {
    const user = buildUser({ providers: [7] })
    await expect(outcomeFor(user)).resolves.toEqual(NOTHING)
  })

  it('denies everything to a Provider Manager whose only rule is on providers', async () => {
    const user = buildUser({
      globalRoleAssignments: [
        globalRoleAssignment('Provider Manager', [{ collections: ['providers'], actions: ['*'] }]),
      ],
    })
    await expect(outcomeFor(user)).resolves.toEqual(NOTHING)
  })

  it('grants read only to a Provider Manager with an added read rule on the collection', async () => {
    const user = buildUser({
      globalRoleAssignments: [
        globalRoleAssignment('Provider Manager', [
          { collections: ['providers'], actions: ['*'] },
          { collections: [COLLECTION], actions: ['read'] },
        ]),
      ],
    })
    await expect(outcomeFor(user)).resolves.toEqual(READ_ONLY)
  })

  it('grants read only to a Tenant Role User, whatever the rule and tenant', async () => {
    const user = buildUser({
      roleAssignments: [roleAssignment([{ collections: ['posts'], actions: ['read'] }])],
    })
    await expect(outcomeFor(user)).resolves.toEqual(READ_ONLY)
  })

  it('grants read only to a Tenant Role User who holds a write rule on the collection', async () => {
    const user = buildUser({
      roleAssignments: [roleAssignment([{ collections: [COLLECTION], actions: ['*'] }])],
    })
    await expect(outcomeFor(user)).resolves.toEqual(READ_ONLY)
  })

  it('grants read only to a user who is both a Provider User and a Tenant Role User', async () => {
    const user = buildUser({
      providers: [7],
      roleAssignments: [roleAssignment([{ collections: ['posts'], actions: ['read'] }])],
    })
    await expect(outcomeFor(user)).resolves.toEqual(READ_ONLY)
  })

  it('grants everything to a Shared Content Editor with no Role Assignment', async () => {
    const user = buildUser({
      globalRoleAssignments: [
        globalRoleAssignment('Shared Content Editor', [
          { collections: [COLLECTION], actions: ['*'] },
        ]),
      ],
    })
    await expect(outcomeFor(user)).resolves.toEqual(EVERYTHING)
  })

  it('grants everything to a Super Admin', async () => {
    const user = buildUser({
      globalRoleAssignments: [
        globalRoleAssignment('Super Admin', [{ collections: ['*'], actions: ['*'] }]),
      ],
    })
    await expect(outcomeFor(user)).resolves.toEqual(EVERYTHING)
  })
})
