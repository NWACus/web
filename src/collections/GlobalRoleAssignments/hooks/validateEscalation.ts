import type { GlobalRoleAssignment, Role } from '@/payload-types'
import { canAssignRole } from '@/utilities/rbac/escalationCheck'
import type { CollectionBeforeValidateHook } from 'payload'
import { ValidationError } from 'payload'

export const validateEscalation: CollectionBeforeValidateHook<GlobalRoleAssignment> = async ({
  data,
  req,
}) => {
  if (!req.user) {
    throw new ValidationError({
      errors: [
        {
          message: 'You must be logged in to assign roles.',
          path: 'roles',
        },
      ],
    })
  }

  if (!data || !data.roles || data.roles.length === 0) {
    // No roles to assign, so no escalation check needed
    return data
  }

  // Fetch the roles being assigned to check their permissions
  const roleIds = data.roles.filter((role): role is number => typeof role === 'number')

  if (roleIds.length === 0) {
    // All roles are already populated objects, we can check them directly
    const roles = data.roles.filter(
      (role): role is Role => typeof role === 'object' && 'rules' in role,
    )

    for (const role of roles) {
      if (!canAssignRole(req.payload.logger, req.user, role)) {
        throw new ValidationError({
          errors: [
            {
              message: `You cannot assign the role "${role.name}" because you do not have sufficient permissions. You can only assign roles with permissions equal to or less than your own.`,
              path: 'roles',
            },
          ],
        })
      }
    }
  } else {
    // Fetch roles from the database
    const roles = await req.payload.find({
      collection: 'roles',
      where: {
        id: {
          in: roleIds,
        },
      },
      depth: 0,
    })

    for (const role of roles.docs) {
      if (!canAssignRole(req.payload.logger, req.user, role)) {
        throw new ValidationError({
          errors: [
            {
              message: `You cannot assign the role "${role.name}" because you do not have sufficient permissions. You can only assign roles with permissions equal to or less than your own.`,
              path: 'roles',
            },
          ],
        })
      }
    }
  }

  return data
}
