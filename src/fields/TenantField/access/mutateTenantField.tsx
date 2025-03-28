import { FieldAccess } from 'payload'
import { globalRolesForUser } from '@/utilities/rbac/globalRolesForUser'
import { ruleMatches } from '@/utilities/rbac/ruleMatches'

export const mutateTenantField: FieldAccess = ({ req: { user, payload } }) => {
  if (!user) {
    return false
  }

  const globalRoles = globalRolesForUser(user, payload.logger)
  return globalRoles
    .map((role) => role.rules)
    .flat()
    .some(ruleMatches('update', 'tenants'))
}
