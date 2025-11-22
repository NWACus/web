import type { Role, RoleAssignment } from '@/payload-types'
import { canAssignRole } from '@/utilities/rbac/escalationCheck'
import type { CollectionBeforeValidateHook } from 'payload'
import { ValidationError } from 'payload'

export const validateEscalation: CollectionBeforeValidateHook<RoleAssignment> = async ({
  data,
  req,
}) => {
  // Bypass the escalation check if this request is from the Local API
  // The admin panel uses the REST API
  if (req.payloadAPI === 'local') {
    return data
  }

  if (!req.user) {
    throw new ValidationError({
      errors: [
        {
          message: 'You must be logged in to assign roles.',
          path: 'role',
        },
      ],
    })
  }

  if (!data || !data.role) {
    // No role to assign, so no escalation check needed
    return data
  }

  // Get the tenant ID for context
  const tenantId = typeof data.tenant === 'object' ? data.tenant.id : data.tenant

  if (!tenantId) {
    throw new ValidationError({
      errors: [
        {
          message: 'No tenant set for this role assignment.',
          path: 'tenant',
        },
      ],
    })
  }

  // Check if the role being assigned needs permission validation
  const role = data.role

  if (typeof role === 'number') {
    // Fetch role from the database
    const roleDoc = await req.payload.findByID({
      collection: 'roles',
      id: role,
      depth: 0,
    })

    if (!canAssignRole(req.payload.logger, req.user, roleDoc, tenantId)) {
      throw new ValidationError({
        errors: [
          {
            message: `You cannot assign the role "${roleDoc.name}" because you do not have sufficient permissions. You can only assign roles with permissions equal to or less than your own.`,
            path: 'role',
          },
        ],
      })
    }
  } else if (typeof role === 'object' && 'rules' in role) {
    // Role is already populated, check it directly
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    if (!canAssignRole(req.payload.logger, req.user, role as Role, tenantId)) {
      throw new ValidationError({
        errors: [
          {
            message: `You cannot assign the role "${role.name}" because you do not have sufficient permissions. You can only assign roles with permissions equal to or less than your own.`,
            path: 'role',
          },
        ],
      })
    }
  }

  return data
}
