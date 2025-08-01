'use server'

import { byGlobalRole } from '@/access/byGlobalRole'
import { User } from '@/payload-types'
import { generateInviteUserEmail } from '@/utilities/email/generateInviteUserEmail'
import { sendEmail } from '@/utilities/email/sendEmail'
import { getURL } from '@/utilities/getURL'
import { canAssignGlobalRole, canAssignRole } from '@/utilities/rbac/escalationCheck'
import config from '@payload-config'
import crypto from 'crypto'
import { headers } from 'next/headers'
import { getPayload, PayloadRequest, ValidationError } from 'payload'
import { formatAdminURL } from 'payload/shared'
import { v4 as uuid } from 'uuid'
import { byGlobalRoleOrTenantRoleAssignmentOrDomain } from '../access/byGlobalRoleOrTenantRoleAssignmentOrDomain'
import { inviteTokenExpirationMs } from './inviteUtils'

function extractPayloadErrorMessage(error: unknown): string {
  if (
    typeof error === 'object' &&
    error !== null &&
    'data' in error &&
    typeof error.data === 'object' &&
    error.data !== null &&
    'errors' in error.data &&
    Array.isArray(error.data.errors)
  ) {
    const fieldErrors = error.data.errors.map((err: unknown) => {
      if (
        typeof err === 'object' &&
        err !== null &&
        'path' in err &&
        'message' in err &&
        typeof err.path === 'string' &&
        typeof err.message === 'string'
      ) {
        if (err.path === 'email' && err.message.includes('already registered')) {
          return 'A user with this email address already exists.'
        }
        return err.message
      }
      return 'Unknown validation error'
    })

    if (fieldErrors.length === 1) {
      return fieldErrors[0]
    }

    return `Validation errors: ${fieldErrors.join(', ')}`
  }

  if (error instanceof Error) {
    return error.message
  }

  return 'Failed to invite user.'
}

export async function inviteUserAction({
  email,
  name,
  roleAssignments,
  globalRoleAssignments,
}: {
  email: string
  name: string
  roleAssignments: {
    roleId: number
    tenantId: number
  }[]
  globalRoleAssignments: number[]
}) {
  try {
    const payload = await getPayload({ config })
    const headersList = await headers()

    const { user: loggedInUser } = await payload.auth({ headers: headersList })

    if (!loggedInUser) {
      throw new Error('You are not allowed to perform that action.')
    }

    const mockedPayloadReq = {
      user: loggedInUser,
      payload,
    } as PayloadRequest

    const canInvite = byGlobalRoleOrTenantRoleAssignmentOrDomain('create')({
      req: mockedPayloadReq,
    })

    if (!canInvite) {
      throw new Error('You are not allowed to perform that action.')
    }

    const inviteExpiration = new Date(Date.now() + inviteTokenExpirationMs).toISOString()

    let user: User | undefined
    const createdRoleAssignmentIds: number[] = []
    const createdGlobalRoleAssignmentIds: number[] = []

    try {
      user = await payload.create({
        collection: 'users',
        data: {
          email,
          name,
          password: uuid(),
          inviteToken: crypto.randomBytes(20).toString('hex'),
          inviteExpiration,
        },
        showHiddenFields: true,
      })

      if (user && Array.isArray(roleAssignments) && roleAssignments.length > 0) {
        for (const assignment of roleAssignments) {
          if (assignment.roleId && assignment.tenantId) {
            const role = await payload.findByID({
              collection: 'roles',
              id: assignment.roleId,
            })
            if (!canAssignRole(payload.logger, loggedInUser, role, assignment.tenantId)) {
              throw new ValidationError({
                errors: [
                  {
                    message: `You are not allowed to assign the ${role.name} role.`,
                    path: 'roles',
                  },
                ],
              })
            }
            const roleAssignment = await payload.create({
              collection: 'roleAssignments',
              data: {
                user: user.id,
                role: assignment.roleId,
                tenant: assignment.tenantId,
              },
            })
            createdRoleAssignmentIds.push(roleAssignment.id)
          }
        }
      }

      const canCreateGlobalRoleAssignments = !!byGlobalRole(
        'create',
        'globalRoleAssignments',
      )({ req: mockedPayloadReq })

      if (
        canCreateGlobalRoleAssignments &&
        user &&
        Array.isArray(globalRoleAssignments) &&
        globalRoleAssignments.length > 0
      ) {
        const populatedGlobalRolesRes = await payload.find({
          collection: 'globalRoles',
          where: {
            id: {
              in: globalRoleAssignments,
            },
          },
        })

        for (const globalRole of populatedGlobalRolesRes.docs) {
          if (!canAssignGlobalRole(payload.logger, loggedInUser, globalRole)) {
            throw new ValidationError({
              errors: [
                {
                  message: `You are not allowed to assign the ${globalRole.name} global role.`,
                  path: 'globalRoles',
                },
              ],
            })
          }
          const globalRoleAssignment = await payload.create({
            collection: 'globalRoleAssignments',
            data: {
              user: user.id,
              globalRole: globalRole.id,
            },
          })
          createdGlobalRoleAssignmentIds.push(globalRoleAssignment.id)
        }
      }

      const currentHost = headersList.get('host')
      const serverURL = getURL(currentHost)
      const acceptInviteURL = formatAdminURL({
        adminRoute: payload.config.routes.admin,
        path: `/accept-invite?token=${user.inviteToken}`,
        serverURL,
      })

      const { html, text, subject } = await generateInviteUserEmail({
        appUrl: serverURL,
        inviteUrl: acceptInviteURL,
      })

      await sendEmail({
        html,
        text,
        subject,
        to: user.email,
      })

      return { success: true, user }
    } catch (error) {
      payload.logger.error(
        `Failed to create user or role assignments: ${error instanceof Error ? error.message : 'Unknown error'}`,
      )

      // Roll back: delete created user, created role assignments if any role assignments fail, and created global role assignments if any role assignments fail
      for (const id of createdRoleAssignmentIds) {
        try {
          await payload.delete({
            collection: 'roleAssignments',
            id,
          })
        } catch (e) {
          payload.logger.error(
            `Failed to delete role assignment ${id}: ${e instanceof Error ? e.message : e}`,
          )
        }
      }

      for (const id of createdGlobalRoleAssignmentIds) {
        try {
          await payload.delete({
            collection: 'globalRoleAssignments',
            id,
          })
        } catch (e) {
          payload.logger.error(
            `Failed to delete global role assignment ${id}: ${e instanceof Error ? e.message : e}`,
          )
        }
      }

      if (user?.id) {
        try {
          await payload.delete({
            collection: 'users',
            id: user.id,
          })
        } catch (e) {
          payload.logger.error(
            `Failed to delete user ${user.id}: ${e instanceof Error ? e.message : e}`,
          )
        }
      }
      return {
        success: false,
        error: extractPayloadErrorMessage(error),
      }
    }
  } catch (error) {
    return {
      success: false,
      error: extractPayloadErrorMessage(error),
    }
  }
}
