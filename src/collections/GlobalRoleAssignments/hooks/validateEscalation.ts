import type { GlobalRoleAssignment } from '@/payload-types'
import { canAssignGlobalRole } from '@/utilities/rbac/escalationCheck'
import type { CollectionBeforeValidateHook } from 'payload'
import { ValidationError } from 'payload'

export const validateEscalation: CollectionBeforeValidateHook<GlobalRoleAssignment> = async ({
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
          path: 'globalRole',
        },
      ],
    })
  }

  if (!data || !data.globalRole) {
    // No role to assign, so no escalation check needed
    return data
  }

  // Check if the global role being assigned needs permission validation
  const globalRole = data.globalRole

  if (typeof globalRole === 'number') {
    // Fetch global role from the database
    const globalRoleDoc = await req.payload.findByID({
      collection: 'globalRoles',
      id: globalRole,
      depth: 0,
    })

    if (!canAssignGlobalRole(req.payload.logger, req.user, globalRoleDoc)) {
      throw new ValidationError({
        errors: [
          {
            message: `You cannot assign the global role "${globalRoleDoc.name}" because you do not have sufficient permissions. You can only assign roles with permissions equal to or less than your own.`,
            path: 'globalRole',
          },
        ],
      })
    }
  } else if (typeof globalRole === 'object' && globalRole && 'rules' in globalRole) {
    // Global role is already populated, check it directly
    if (!canAssignGlobalRole(req.payload.logger, req.user, globalRole)) {
      throw new ValidationError({
        errors: [
          {
            message: `You cannot assign the global role "${globalRole.name}" because you do not have sufficient permissions. You can only assign roles with permissions equal to or less than your own.`,
            path: 'globalRole',
          },
        ],
      })
    }
  }

  return data
}
