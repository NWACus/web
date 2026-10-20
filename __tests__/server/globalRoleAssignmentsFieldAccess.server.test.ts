import { globalRoleAssignmentsFieldAccess } from '@/collections/Users/access/globalRoleAssignmentsFieldAccess'
import { GlobalRole, GlobalRoleAssignment, User } from '@/payload-types'
import type { PayloadRequest } from 'payload'
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
