import { Role, User } from '@/payload-types'
import { Logger } from 'pino'
import { globalRoleAssignmentsForUser } from './globalRoleAssignmentsForUser'
import { roleAssignmentsForUser } from './roleAssignmentsForUser'
import { ruleMatches } from './ruleMatches'

/**
 * Helper function to check if user's permissions cover all permissions in target role
 */
const hasPermissionsForRole = (
  userRoles: Role[],
  targetRole: Role,
  logger: Logger,
  userId: string | number,
): boolean => {
  const userPermissions = new Set<string>()

  userRoles.forEach((role: Role) => {
    role.rules.forEach(
      (rule: {
        collections: string[]
        actions: ('*' | 'create' | 'read' | 'update' | 'delete')[]
        id?: string | null
      }) => {
        rule.collections.forEach((collection: string) => {
          rule.actions.forEach((action: string) => {
            if (collection === '*' && action === '*') {
              userPermissions.add('*:*')
            } else if (collection === '*') {
              userPermissions.add(`*:${action}`)
            } else if (action === '*') {
              userPermissions.add(`${collection}:*`)
            } else {
              userPermissions.add(`${collection}:${action}`)
            }
          })
        })
      },
    )
  })

  for (const rule of targetRole.rules) {
    for (const collection of rule.collections) {
      for (const action of rule.actions) {
        const permissionKey = `${collection}:${action}`

        const hasPermission =
          userPermissions.has('*:*') ||
          userPermissions.has(`${collection}:*`) ||
          userPermissions.has(`*:${action}`) ||
          userPermissions.has(permissionKey)

        if (!hasPermission) {
          logger.warn(
            `User ${userId} cannot assign role ${targetRole.id} - missing permission: ${permissionKey}`,
          )
          return false
        }
      }
    }
  }

  return true
}

/**
 * Checks if a user has sufficient permissions to assign a global role.
 * A user can only assign global roles that have permissions equal to or less than their own.
 *
 * @param logger - Logger instance
 * @param user - The user attempting to assign the global role
 * @param targetRole - The global role being assigned
 * @returns true if the user has sufficient permissions, false otherwise
 */
export const canAssignGlobalRole = (logger: Logger, user: User, targetRole: Role): boolean => {
  const userGlobalRoleAssignments = globalRoleAssignmentsForUser(logger, user)

  // Check if user has any global roles that grant them permission to assign global roles
  const hasGlobalRolePermission = userGlobalRoleAssignments.some((assignment) => {
    if (typeof assignment.globalRole === 'number') return false
    return assignment.globalRole?.rules.some(ruleMatches('create', 'globalRoleAssignments'))
  })

  if (hasGlobalRolePermission) {
    return true
  }

  // Check if user's global roles have at least the same permissions as the target role
  const userGlobalRoles = userGlobalRoleAssignments
    .map((assignment) => assignment.globalRole)
    .filter((role): role is Role => typeof role !== 'number' && role !== null)

  return hasPermissionsForRole(userGlobalRoles, targetRole, logger, user.id)
}

/**
 * Checks if a user has sufficient permissions to assign a tenant-scoped role.
 * A user can only assign roles that have permissions equal to or less than their own for that tenant.
 *
 * @param logger - Logger instance
 * @param user - The user attempting to assign the role
 * @param targetRole - The role being assigned
 * @param tenantId - Tenant ID for the role assignment
 * @returns true if the user has sufficient permissions, false otherwise
 */
export const canAssignRole = (
  logger: Logger,
  user: User,
  targetRole: Role,
  tenantId: string | number,
): boolean => {
  const userGlobalRoleAssignments = globalRoleAssignmentsForUser(logger, user)
  const userRoleAssignments = roleAssignmentsForUser(logger, user)

  // Check if user has any global roles that grant them permission to assign roles
  const hasGlobalRolePermission = userGlobalRoleAssignments.some((assignment) => {
    if (typeof assignment.globalRole === 'number') return false
    return assignment.globalRole?.rules.some(ruleMatches('create', 'roleAssignments'))
  })

  if (hasGlobalRolePermission) {
    return true
  }

  // Check tenant-specific permissions
  const userTenantRoleAssignments = userRoleAssignments.filter((assignment) => {
    if (typeof assignment.tenant === 'number') {
      return assignment.tenant === tenantId
    }
    return assignment.tenant?.id === tenantId
  })

  const hasTenantRolePermission = userTenantRoleAssignments.some((assignment) => {
    if (typeof assignment.role === 'number') return false
    return assignment.role?.rules.some(ruleMatches('create', 'roleAssignments'))
  })

  if (!hasTenantRolePermission) {
    return false
  }

  // Check if user's roles have at least the same permissions as the target role
  const userGlobalRoles = userGlobalRoleAssignments
    .map((assignment) => assignment.globalRole)
    .filter((role): role is Role => typeof role !== 'number' && role !== null)

  const userTenantRoles = userTenantRoleAssignments
    .map((assignment) => assignment.role)
    .filter((role): role is Role => typeof role !== 'number' && role !== null)

  const userRoles = [...userGlobalRoles, ...userTenantRoles]

  return hasPermissionsForRole(userRoles, targetRole, logger, user.id)
}
