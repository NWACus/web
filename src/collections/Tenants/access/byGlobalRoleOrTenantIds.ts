import { byGlobalRole } from '@/access/byGlobalRole'
import { roleAssignmentsForUser } from '@/utilities/rbac/roleAssignmentsForUser'
import { ruleMatches, ruleMethod } from '@/utilities/rbac/ruleMatches'
import { Access, CollectionConfig } from 'payload'

// byGlobalRoleOrTenantIds supplants global access review with tenant-scoped tenant grants, allowing tenant
// scoped role assignments for tenant access to apply for the tenant identified in the role assignment
export const byGlobalRoleOrTenantIds: (method: ruleMethod) => Access =
  (method: ruleMethod): Access =>
  (args) => {
    if (!args.req.user) {
      return false
    }

    const globalAccess = byGlobalRole(method, 'tenants')(args)
    if (typeof globalAccess === 'boolean' ? globalAccess : true) {
      // if globalAccess returned anything but 'false', pass it along
      return globalAccess
    }

    const roleAssignments = roleAssignmentsForUser(args.req.payload.logger, args.req.user)
    const matchingTenantIds = roleAssignments
      .filter(
        (assignment) =>
          assignment.role &&
          typeof assignment.role !== 'number' && // captured in the getter
          assignment.role.rules.some(ruleMatches(method, 'tenants')),
      )
      .map((assignment) => assignment.tenant)
      .filter((tenant) => typeof tenant !== 'number') // captured in the getter
      .map((tenant) => tenant.id)

    if (matchingTenantIds.length > 0) {
      return {
        id: {
          in: matchingTenantIds,
        },
      }
    }

    return false
  }

export const byGlobalRoleOrTenantIdsWithOwnTenantsRead: (method: ruleMethod) => Access =
  (method: ruleMethod): Access =>
  (args) => {
    if (!args.req.user) {
      return false
    }

    const globalAccess = byGlobalRole(method, 'tenants')(args)
    if (typeof globalAccess === 'boolean' ? globalAccess : true) {
      // if globalAccess returned anything but 'false', pass it along
      return globalAccess
    }

    const roleAssignments = roleAssignmentsForUser(args.req.payload.logger, args.req.user)
    const matchingTenantIds = roleAssignments
      .filter(
        (assignment) =>
          assignment.role &&
          typeof assignment.role !== 'number' && // captured in the getter
          assignment.role.rules.some(ruleMatches(method, 'tenants')),
      )
      .map((assignment) => assignment.tenant)
      .filter((tenant) => !!tenant && typeof tenant !== 'number') // captured in the getter
      .map((tenant) => tenant.id)

    if (matchingTenantIds.length > 0) {
      return {
        id: {
          in: matchingTenantIds,
        },
      }
    }

    const tenantIdsUserHasRoleAssignmentsFor = roleAssignments
      .map((assignment) => assignment.tenant)
      .filter((tenant) => !!tenant && typeof tenant !== 'number')
      .map((tenant) => tenant.id)

    if (tenantIdsUserHasRoleAssignmentsFor.length > 0) {
      return {
        id: {
          in: tenantIdsUserHasRoleAssignmentsFor,
        },
      }
    }

    return false
  }

export const accessByGlobalRoleOrTenantIds: CollectionConfig['access'] = {
  create: byGlobalRoleOrTenantIds('create'),
  read: byGlobalRoleOrTenantIdsWithOwnTenantsRead('read'),
  update: byGlobalRoleOrTenantIds('update'),
  delete: byGlobalRoleOrTenantIds('delete'),
}
