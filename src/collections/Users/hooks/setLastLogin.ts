import configPromise from '@payload-config'
import { getPayload, type CollectionAfterLoginHook } from 'payload'

export const setLastLogin: CollectionAfterLoginHook = async ({ user }) => {
  const payload = await getPayload({ config: configPromise })

  try {
    await payload.update({
      collection: 'users',
      id: user.id,
      data: {
        lastLogin: new Date().toISOString(),
      },
    })
  } catch (err) {
    payload.logger.warn(
      `Failed to set user's lastLogin: ${err instanceof Error ? err.message : 'Unknown error'}`,
    )
  }

  return user
}
