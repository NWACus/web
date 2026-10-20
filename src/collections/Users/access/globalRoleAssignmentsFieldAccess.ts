import { byGlobalRole } from '@/access/byGlobalRole'
import type { FieldAccess } from 'payload'

// Self-read keeps the user's own assignments on the user that admin views get (Payload 3.90+ applies field read access to it)
export const globalRoleAssignmentsFieldAccess: FieldAccess = (args) =>
  (!!args.req.user && args.doc?.id === args.req.user.id) ||
  byGlobalRole('read', 'globalRoles')(args)
