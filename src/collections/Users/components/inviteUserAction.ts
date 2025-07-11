'use server'

import config from '@payload-config'
import crypto from 'crypto'
import { getPayload } from 'payload'
import { v4 as uuid } from 'uuid'

export async function inviteUserAction({ email }: { email: string }) {
  try {
    const payload = await getPayload({ config })

    const inviteExpiration = new Date(Date.now() + 3600000).toISOString()

    const user = await payload.create({
      collection: 'users',
      data: {
        email,
        name: 'test',
        password: uuid(),
        inviteToken: crypto.randomBytes(20).toString('hex'),
        inviteExpiration,
      },
    })
    return { success: true, user }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to invite user.',
    }
  }
}
