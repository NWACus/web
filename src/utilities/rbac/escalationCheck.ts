import { Role, User } from '@/payload-types'
import { Logger } from 'pino'
import { globalRoleAssignmentsForUser } from './globalRoleAssignmentsForUser'
import { roleAssignmentsForUser } from './roleAssignmentsForUser'
import { ruleMatches } from './ruleMatches'

/**
 * Checks if a user has sufficient permissions to assign a given role.
 * A user can only assign roles that have permissions equal to or less than their own.
 *
 * @param logger - Logger instance
 * @param user - The user attempting to assign the role
 * @param targetRole - The role being assigned
 * @param tenantId - Optional tenant ID for tenant-scoped role assignments
 * @returns true if the user has sufficient permissions, false otherwise
 */
export const canAssignRole = (
  logger: Logger,
  user: User,
  targetRole: Role,
  tenantId?: string | number,
): boolean => {
  // Get all roles the user has
  const userGlobalRoleAssignments = globalRoleAssignmentsForUser(logger, user)
  const userRoleAssignments = roleAssignmentsForUser(logger, user)

  // Check if user has any global roles that grant them permission to assign roles
  const hasGlobalRolePermission = userGlobalRoleAssignments.some((assignment) => {
    if (typeof assignment.globalRole === 'number') return false
    return assignment.globalRole?.rules.some(ruleMatches('create', 'globalRoleAssignments'))
  })

  if (hasGlobalRolePermission) {
    // Global role permission trumps all - they can assign any role
    return true
  }

  // For tenant-scoped role assignments, check tenant-specific permissions
  if (tenantId) {
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
  }

  // Now check if the user's roles have at least the same permissions as the target role
  const userGlobalRoles = userGlobalRoleAssignments
    .map((assignment) => assignment.globalRole)
    .filter((role): role is Role => typeof role !== 'number' && role !== null)

  const userRoles = [...userGlobalRoles]

  // Add tenant-scoped roles if we're in a tenant context
  if (tenantId) {
    const userTenantRoleAssignments = userRoleAssignments.filter((assignment) => {
      if (typeof assignment.tenant === 'number') {
        return assignment.tenant === tenantId
      }
      return assignment.tenant?.id === tenantId
    })

    userTenantRoleAssignments.forEach((assignment) => {
      if (assignment.role && typeof assignment.role !== 'number') {
        userRoles.push(assignment.role)
      }
    })
  }

  // Check if user's roles cover all the permissions in the target role
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
              // Wildcard permission - covers everything
              userPermissions.add('*:*')
            } else if (collection === '*') {
              // Wildcard collection with specific action
              userPermissions.add(`*:${action}`)
            } else if (action === '*') {
              // Specific collection with wildcard action
              userPermissions.add(`${collection}:*`)
            } else {
              // Specific collection and action
              userPermissions.add(`${collection}:${action}`)
            }
          })
        })
      },
    )
  })

  // Check if target role's permissions are covered by user's permissions
  for (const rule of targetRole.rules) {
    for (const collection of rule.collections) {
      for (const action of rule.actions) {
        const permissionKey = `${collection}:${action}`

        // Check if user has this specific permission or a wildcard that covers it
        const hasPermission =
          userPermissions.has('*:*') ||
          userPermissions.has(`${collection}:*`) ||
          userPermissions.has(`*:${action}`) ||
          userPermissions.has(permissionKey)

        if (!hasPermission) {
          logger.warn(
            `User ${user.id} cannot assign role ${targetRole.id} - missing permission: ${permissionKey}`,
          )
          return false
        }
      }
    }
  }

  return true
}
