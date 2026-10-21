import { byGlobalRole } from '@/access/byGlobalRole'
import { getUser } from '@/utilities/isUser'
import type { FieldAccess } from 'payload'

// Users can always read their own assignments. Since Payload 3.90 the logged-in user passes
// through this check before admin views see it, and the admin UI's permission checks need them.
export const globalRoleAssignmentsFieldAccess: FieldAccess = (args) =>
  (args.doc?.id !== undefined && getUser(args.req)?.id === args.doc.id) ||
  byGlobalRole('read', 'globalRoles')(args)
