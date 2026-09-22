import type { User } from '@/payload-types'
import payload, { ClientUser } from 'payload'
import { hasGlobalRolePermission } from './hasGlobalOrTenantRolePermission'
import { roleAssignmentsForUser } from './roleAssignmentsForUser'
import { ruleCollection } from './ruleMatches'

// Read on Shared Content is structural: holding any Role Assignment at all is enough, because
// shared documents render on every center's site. See docs/decisions/022-shared-content.md.
// Synchronous so it can also drive `admin.hidden`, which only receives `{ user }`.
export const canReadSharedContent = ({
  collection,
  user,
}: {
  collection: ruleCollection
  user: User | ClientUser | null
}): boolean => {
  if (!user) {
    return false
  }

  if (roleAssignmentsForUser(payload.logger, user).length > 0) {
    return true
  }

  return hasGlobalRolePermission({ method: 'read', collection, user })
}
