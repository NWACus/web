import { Role } from '@/payload-types'
import { hasPermissionsForRole } from '@/utilities/rbac/escalationCheck'
import { Logger } from 'pino'

function buildMockLogger(): jest.Mocked<Logger> {
  // @ts-expect-error - partial mock of pino Logger; only methods used in tests are provided
  return {
    warn: jest.fn(),
    info: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  }
}

describe('hasPermissionsForRole', () => {
  let mockLogger: jest.Mocked<Logger>

  beforeEach(() => {
    mockLogger = buildMockLogger()
    jest.clearAllMocks()
  })

  const createRole = (id: number, rules: Role['rules']): Role => ({
    id,
    rules,
    name: `Role ${id}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  })

  describe('basic permission checking', () => {
    it('allows when user has exact same permissions as target role', () => {
      const userRoles = [
        createRole(1, [
          {
            collections: ['posts'],
            actions: ['read', 'update'],
          },
        ]),
      ]
      const targetRole = createRole(2, [
        {
          collections: ['posts'],
          actions: ['read', 'update'],
        },
      ])

      const result = hasPermissionsForRole(userRoles, targetRole, mockLogger, '1')

      expect(result).toBe(true)
      expect(mockLogger.warn).not.toHaveBeenCalled()
    })

    it('denies when user lacks required permission', () => {
      const userRoles = [
        createRole(1, [
          {
            collections: ['posts'],
            actions: ['read'],
          },
        ]),
      ]
      const targetRole = createRole(2, [
        {
          collections: ['posts'],
          actions: ['read', 'update'],
        },
      ])

      const result = hasPermissionsForRole(userRoles, targetRole, mockLogger, '1')

      expect(result).toBe(false)
      expect(mockLogger.warn).toHaveBeenCalledWith(
        'User 1 cannot assign role 2 - missing permission: posts:update',
      )
    })

    it('allows when user has more permissions than target role', () => {
      const userRoles = [
        createRole(1, [
          {
            collections: ['posts'],
            actions: ['read', 'update', 'delete'],
          },
        ]),
      ]
      const targetRole = createRole(2, [
        {
          collections: ['posts'],
          actions: ['read', 'update'],
        },
      ])

      const result = hasPermissionsForRole(userRoles, targetRole, mockLogger, '1')

      expect(result).toBe(true)
      expect(mockLogger.warn).not.toHaveBeenCalled()
    })
  })

  describe('wildcard permissions', () => {
    it('allows any permission when user has *:*', () => {
      const userRoles = [
        createRole(3, [
          {
            collections: ['*'],
            actions: ['*'],
          },
        ]),
      ]
      const targetRole = createRole(2, [
        {
          collections: ['posts', 'comments'],
          actions: ['read', 'update', 'delete'],
        },
      ])

      const result = hasPermissionsForRole(userRoles, targetRole, mockLogger, '1')

      expect(result).toBe(true)
      expect(mockLogger.warn).not.toHaveBeenCalled()
    })

    it('allows any action on specific collection when user has collection:*', () => {
      const userRoles = [
        createRole(4, [
          {
            collections: ['posts'],
            actions: ['*'],
          },
        ]),
      ]
      const targetRole = createRole(2, [
        {
          collections: ['posts'],
          actions: ['read', 'update', 'delete'],
        },
      ])

      const result = hasPermissionsForRole(userRoles, targetRole, mockLogger, '1')

      expect(result).toBe(true)
      expect(mockLogger.warn).not.toHaveBeenCalled()
    })

    it('allows specific action on any collection when user has *:action', () => {
      const userRoles = [
        createRole(5, [
          {
            collections: ['*'],
            actions: ['read'],
          },
        ]),
      ]
      const targetRole = createRole(2, [
        {
          collections: ['posts', 'comments'],
          actions: ['read'],
        },
      ])

      const result = hasPermissionsForRole(userRoles, targetRole, mockLogger, '1')

      expect(result).toBe(true)
      expect(mockLogger.warn).not.toHaveBeenCalled()
    })

    it('denies when wildcard does not cover required permission', () => {
      const userRoles = [
        createRole(6, [
          {
            collections: ['posts'],
            actions: ['*'],
          },
        ]),
      ]
      const targetRole = createRole(2, [
        {
          collections: ['comments'],
          actions: ['read'],
        },
      ])

      const result = hasPermissionsForRole(userRoles, targetRole, mockLogger, '1')

      expect(result).toBe(false)
      expect(mockLogger.warn).toHaveBeenCalledWith(
        'User 1 cannot assign role 2 - missing permission: comments:read',
      )
    })
  })

  describe('multiple user roles', () => {
    it('combines permissions from multiple roles', () => {
      const userRoles = [
        createRole(7, [
          {
            collections: ['posts'],
            actions: ['read', 'update'],
          },
        ]),
        createRole(8, [
          {
            collections: ['comments'],
            actions: ['read', 'delete'],
          },
        ]),
      ]
      const targetRole = createRole(2, [
        {
          collections: ['posts'],
          actions: ['read'],
        },
        {
          collections: ['comments'],
          actions: ['delete'],
        },
      ])

      const result = hasPermissionsForRole(userRoles, targetRole, mockLogger, '1')

      expect(result).toBe(true)
      expect(mockLogger.warn).not.toHaveBeenCalled()
    })

    it('denies when combined roles still lack required permission', () => {
      const userRoles = [
        createRole(7, [
          {
            collections: ['posts'],
            actions: ['read'],
          },
        ]),
        createRole(8, [
          {
            collections: ['comments'],
            actions: ['read'],
          },
        ]),
      ]
      const targetRole = createRole(2, [
        {
          collections: ['posts'],
          actions: ['update'],
        },
      ])

      const result = hasPermissionsForRole(userRoles, targetRole, mockLogger, '1')

      expect(result).toBe(false)
      expect(mockLogger.warn).toHaveBeenCalledWith(
        'User 1 cannot assign role 2 - missing permission: posts:update',
      )
    })
  })

  describe('edge cases', () => {
    it('denies when user has no roles', () => {
      const userRoles: Role[] = []
      const targetRole = createRole(2, [
        {
          collections: ['posts'],
          actions: ['read'],
        },
      ])

      const result = hasPermissionsForRole(userRoles, targetRole, mockLogger, '1')

      expect(result).toBe(false)
      expect(mockLogger.warn).toHaveBeenCalledWith(
        'User 1 cannot assign role 2 - missing permission: posts:read',
      )
    })

    it('allows when target role has no rules', () => {
      const userRoles = [
        createRole(1, [
          {
            collections: ['posts'],
            actions: ['read'],
          },
        ]),
      ]
      const targetRole = createRole(9, [])

      const result = hasPermissionsForRole(userRoles, targetRole, mockLogger, '1')

      expect(result).toBe(true)
      expect(mockLogger.warn).not.toHaveBeenCalled()
    })

    it('handles numeric user IDs', () => {
      const userRoles = [
        createRole(1, [
          {
            collections: ['posts'],
            actions: ['read'],
          },
        ]),
      ]
      const targetRole = createRole(2, [
        {
          collections: ['posts'],
          actions: ['update'],
        },
      ])

      const result = hasPermissionsForRole(userRoles, targetRole, mockLogger, 123)

      expect(result).toBe(false)
      expect(mockLogger.warn).toHaveBeenCalledWith(
        'User 123 cannot assign role 2 - missing permission: posts:update',
      )
    })
  })

  describe('complex scenarios', () => {
    it('handles multiple collections and actions in single rule', () => {
      const userRoles = [
        createRole(10, [
          {
            collections: ['posts', 'comments'],
            actions: ['read', 'update'],
          },
        ]),
      ]
      const targetRole = createRole(2, [
        {
          collections: ['posts'],
          actions: ['read'],
        },
        {
          collections: ['comments'],
          actions: ['update'],
        },
      ])

      const result = hasPermissionsForRole(userRoles, targetRole, mockLogger, '1')

      expect(result).toBe(true)
      expect(mockLogger.warn).not.toHaveBeenCalled()
    })

    it('stops at first missing permission', () => {
      const userRoles = [
        createRole(11, [
          {
            collections: ['posts'],
            actions: ['read'],
          },
        ]),
      ]
      const targetRole = createRole(2, [
        {
          collections: ['posts'],
          actions: ['update', 'delete'], // Both missing, should stop at first
        },
      ])

      const result = hasPermissionsForRole(userRoles, targetRole, mockLogger, '1')

      expect(result).toBe(false)
      // Should only warn about the first missing permission encountered
      expect(mockLogger.warn).toHaveBeenCalledTimes(1)
      expect(mockLogger.warn).toHaveBeenCalledWith(
        'User 1 cannot assign role 2 - missing permission: posts:update',
      )
    })
  })
})
