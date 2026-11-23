import { byGlobalRole } from '@/access/byGlobalRole'
import { isMember } from '@/utilities/isMember'
import { roleAssignmentsForUser } from '@/utilities/rbac/roleAssignmentsForUser'
import { ruleMatches } from '@/utilities/rbac/ruleMatches'
import { getTenantSlugFromCookie } from '@/utilities/tenancy/getTenantFromCookie'
import type { Access, PayloadRequest } from 'payload'

/** Tenant ids whose roles let this staff user read Members, narrowed to the selected tenant. */
function tenantIdsWithMemberRead(req: PayloadRequest): number[] {
  const { user, payload, headers } = req
  if (!user) return []
  const tenants = roleAssignmentsForUser(payload.logger, user)
    .filter(
      (assignment) =>
        assignment.role &&
        typeof assignment.role !== 'number' &&
        assignment.role.rules.some(ruleMatches('read', 'members')),
    )
    .map((assignment) => assignment.tenant)
    .filter((tenant) => typeof tenant !== 'number')

  const selectedSlug = getTenantSlugFromCookie(headers)
  return tenants
    .filter((tenant) => !selectedSlug || tenant.slug === selectedSlug)
    .map((tenant) => tenant.id)
}

/**
 * Members are global, so the Membership is the privacy boundary (ADR 026): a tenant admin only
 * sees Members holding a Membership with a center they administer. A Member sees itself.
 */
export const readMembers: Access = async ({ req }) => {
  const { user, payload } = req
  if (!user) return false
  if (isMember(user)) return { id: { equals: user.id } }
  if (await byGlobalRole('read', 'members')({ req })) return true

  const tenantIds = tenantIdsWithMemberRead(req)
  if (tenantIds.length === 0) return false

  const { docs } = await payload.find({
    collection: 'memberships',
    where: { tenant: { in: tenantIds } },
    select: { member: true },
    depth: 0,
    pagination: false,
    req,
  })
  const memberIds = docs.map((doc) => (typeof doc.member === 'string' ? doc.member : doc.member.id))
  return { id: { in: memberIds } }
}

export const membersAccess = {
  // Better Auth creates Members; the admin never does.
  create: () => false,
  read: readMembers,
  update: byGlobalRole('update', 'members'),
  delete: byGlobalRole('delete', 'members'),
}
