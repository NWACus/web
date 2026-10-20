import { byGlobalRole } from '@/access/byGlobalRole'
import { globalRoleAssignmentsFieldAccess } from '@/collections/Users/access/globalRoleAssignmentsFieldAccess'
import { GlobalRole, GlobalRoleAssignment, User } from '@/payload-types'
import type { FieldAccess, PayloadRequest, SanitizedCollectionConfig } from 'payload'
import { applyUserReadAccess } from 'payload/internal'
import { Logger } from 'pino'

const timestamps = { createdAt: '2026-10-20T00:00:00.000Z', updatedAt: '2026-10-20T00:00:00.000Z' }

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
  // @ts-expect-error - partial PayloadRequest; this access function reads only user and payload.logger
  return { user, payload: { logger: buildMockLogger() } }
}

function globalRoleAssignment(name: string, rules: GlobalRole['rules']): GlobalRoleAssignment {
  return {
    id: 1,
    globalRole: { id: 1, name, rules, ...timestamps },
    ...timestamps,
  }
}

function buildUser(id: number, globalRoleAssignments: GlobalRoleAssignment[] = []): User {
  return {
    id,
    name: 'Test User',
    email: `user${id}@avy.com`,
    collection: 'users',
    globalRoleAssignments: { docs: globalRoleAssignments },
    ...timestamps,
  }
}

// Matches the production Provider Manager role: no rule on globalRoles
const providerManager = buildUser(1, [
  globalRoleAssignment('Provider Manager', [
    { collections: ['providers'], actions: ['*'] },
    { collections: ['users'], actions: ['create', 'read', 'update'] },
  ]),
])

const superAdmin = buildUser(2, [
  globalRoleAssignment('Super Admin', [{ collections: ['*'], actions: ['*'] }]),
])

describe('globalRoleAssignmentsFieldAccess', () => {
  it('lets a user read their own assignments without read on globalRoles', () => {
    expect(
      globalRoleAssignmentsFieldAccess({
        req: buildRequest(providerManager),
        doc: providerManager,
      }),
    ).toBe(true)
  })

  it("hides another user's assignments without read on globalRoles", () => {
    expect(
      globalRoleAssignmentsFieldAccess({ req: buildRequest(providerManager), doc: buildUser(3) }),
    ).toBe(false)
  })

  it("lets a user with read on globalRoles read another user's assignments", () => {
    expect(
      globalRoleAssignmentsFieldAccess({ req: buildRequest(superAdmin), doc: buildUser(3) }),
    ).toBe(true)
  })

  it('denies an anonymous request', () => {
    expect(globalRoleAssignmentsFieldAccess({ req: buildRequest(null), doc: buildUser(3) })).toBe(
      false,
    )
  })
})

function buildMinimalUsersCollection(read: FieldAccess): SanitizedCollectionConfig {
  const fields = [
    {
      name: 'globalRoleAssignments',
      type: 'join',
      collection: 'globalRoleAssignments',
      on: 'user',
      access: { read },
    },
  ]
  // @ts-expect-error - minimal sanitized collection; afterRead reads only slug and fields
  return { slug: 'users', fields, flattenedFields: fields }
}

function buildAdminViewRequest(user: User): PayloadRequest {
  const payload = {
    logger: buildMockLogger(),
    config: { localization: false },
    collections: {
      globalRoleAssignments: {
        config: { slug: 'globalRoleAssignments', fields: [], flattenedFields: [] },
      },
    },
  }
  // @ts-expect-error - partial PayloadRequest; afterRead at depth 0 needs only these
  return { user, context: {}, payload }
}

// Runs the user through the pipeline Payload 3.90+ admin views use
function userSeenByAdminViews(user: User, read: FieldAccess) {
  return applyUserReadAccess({
    collection: buildMinimalUsersCollection(read),
    depth: 0,
    overrideAccess: false,
    req: buildAdminViewRequest(user),
    showHiddenFields: false,
    user,
  })
}

describe('the user that admin views get (applyUserReadAccess)', () => {
  it("keeps a provider manager's own global role assignments", async () => {
    const seen = await userSeenByAdminViews(providerManager, globalRoleAssignmentsFieldAccess)
    expect('globalRoleAssignments' in seen).toBe(true)
  })

  it('strips them under the old globalRoles-only rule (#1415)', async () => {
    const seen = await userSeenByAdminViews(providerManager, byGlobalRole('read', 'globalRoles'))
    expect('globalRoleAssignments' in seen).toBe(false)
  })
})
