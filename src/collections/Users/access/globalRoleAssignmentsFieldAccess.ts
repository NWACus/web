import { byGlobalRole } from '@/access/byGlobalRole'
import type { FieldAccess } from 'payload'

// Users can always read their own assignments. Since Payload 3.90 the logged-in user passes
// through this check before admin views see it, and the admin UI's permission checks need them.
export const globalRoleAssignmentsFieldAccess: FieldAccess = (args) =>
  (!!args.req.user && args.doc?.id === args.req.user.id) ||
  byGlobalRole('read', 'globalRoles')(args)
