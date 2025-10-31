import type { User } from '@/payload-types'
import payload, { ClientUser } from 'payload'
import { globalRoleAssignmentsForUser } from './globalRoleAssignmentsForUser'
import { roleAssignmentsForUser } from './roleAssignmentsForUser'
import { ruleCollection, ruleMatches, ruleMethod } from './ruleMatches'

// hasGlobalOrTenantRolePermission checks to see if the passed in user has a global or tenant role that grants them
// the passed in method + collection permission. This ignores which tenant they have that permission on.
// This function is primarily used for sync `admin.hidden` functions on collections that have public read
// but should not be visible in the admin panel for users without explicit read permission.
export const hasGlobalOrTenantRolePermission = ({
  method,
  collection,
  user,
}: {
  method: ruleMethod
  collection: ruleCollection
  user: User | ClientUser | null
}): boolean => {
  return (
    hasGlobalRolePermission({ method, collection, user }) ||
    hasTenantRolePermission({ method, collection, user })
  )
}

export const hasGlobalRolePermission = ({
  method,
  collection,
  user,
}: {
  method: ruleMethod
  collection: ruleCollection
  user: User | ClientUser | null
}): boolean => {
  if (!user) {
    return false
  }

  const globalAssignments = globalRoleAssignmentsForUser(payload.logger, user)
  const globalRolesMatch = globalAssignments
    .map((assignment) => {
      if (assignment.globalRole && typeof assignment.globalRole !== 'number') {
        return assignment.globalRole.rules
      }
      return []
    })
    .flat()
    .some(ruleMatches(method, collection))

  return globalRolesMatch
}

export const hasTenantRolePermission = ({
  method,
  collection,
  user,
}: {
  method: ruleMethod
  collection: ruleCollection
  user: User | ClientUser | null
}): boolean => {
  if (!user) {
    return false
  }

  const roleAssignments = roleAssignmentsForUser(payload.logger, user)
  const matchingTenantIds = roleAssignments
    .filter(
      (assignment) =>
        assignment.role &&
        typeof assignment.role !== 'number' && // captured in the getter
        assignment.role.rules.some(ruleMatches(method, collection)),
    )
    .map((assignment) => assignment.tenant)
    .filter((tenant) => typeof tenant !== 'number') // captured in the getter
    .map((tenant) => tenant.id)

  return matchingTenantIds.length > 0
}
