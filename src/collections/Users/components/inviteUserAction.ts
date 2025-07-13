'use server'

import { getURL } from '@/utilities/getURL'
import config from '@payload-config'
import crypto from 'crypto'
import { headers } from 'next/headers'
import { getPayload, PayloadRequest } from 'payload'
import { formatAdminURL } from 'payload/shared'
import { v4 as uuid } from 'uuid'
import { byGlobalRoleOrTenantRoleAssignmentOrDomain } from '../access/byGlobalRoleOrTenantRoleAssignmentOrDomain'

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

export async function inviteUserAction({ email, name }: { email: string; name: string }) {
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

    const inviteExpiration = new Date(Date.now() + 864_000_000).toISOString() // 10 days

    const user = await payload.create({
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

    const currentHost = headersList.get('host')
    const serverURL = getURL(currentHost)
    const acceptInviteURL = formatAdminURL({
      adminRoute: payload.config.routes.admin,
      path: `/accept-invite?token=${user.inviteToken}`,
      serverURL,
    })

    const html = `
      <p>You have been invited to join AvyFx.</p>
      <p>Please click the link below to set your password and complete your account setup:</p>
      <a href="${acceptInviteURL}">${acceptInviteURL}</a>
      <p>This link will expire in 10 days.</p>
      <p>If you did not expect this invitation, please ignore this email.</p>
    `

    const subject = 'You have been invited to join AvyFx'

    const emailDefaultFromName = process.env.EMAIL_DEFAULT_FROM_NAME || 'AvyFx Support'
    const emailDefaultFromAddress = process.env.EMAIL_DEFAULT_FROM_ADDRESS || 'support@avy-fx.org'

    await payload.email.sendEmail({
      from: `"${emailDefaultFromName}" <${emailDefaultFromAddress}>`,
      html,
      subject,
      to: user.email,
    })

    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: extractPayloadErrorMessage(error),
    }
  }
}
