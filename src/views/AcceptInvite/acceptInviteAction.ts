'use server'

import config from '@payload-config'
import { getPayload } from 'payload'

export async function acceptInviteAction({
  token,
  name,
  password,
}: {
  token: string
  name: string
  password: string
}) {
  try {
    const payload = await getPayload({ config })

    if (!token || !password || !name) {
      return { success: false, error: 'Missing required fields: token, password, name' }
    }

    // Find user with valid invite token
    const usersRes = await payload.find({
      collection: 'users',
      where: {
        inviteToken: { equals: token },
        inviteExpiration: { greater_than: new Date().toISOString() },
      },
      limit: 1,
    })

    if (!usersRes.docs.length) {
      return {
        success: false,
        error:
          'Invite is either invalid or has expired. Please request a new invite from your admin.',
      }
    }

    const user = usersRes.docs[0]

    // Update user with new password and clear invite token
    await payload.update({
      collection: 'users',
      id: user.id,
      data: {
        name,
        password,
        inviteToken: null,
        inviteExpiration: null,
      },
    })

    return { success: true, email: user.email }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to accept invite',
    }
  }
}
