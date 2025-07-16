import PostHogClient from '@/posthog'
import type { CollectionAfterLoginHook } from 'payload'

export const posthogIdentifyAfterLogin: CollectionAfterLoginHook = async ({ user }) => {
  const posthog = PostHogClient()
  if (posthog && user?.id && user?.email) {
    await posthog.capture({
      distinctId: user.id.toString(),
      event: '$identify',
      properties: {
        $set: {
          email: user.email,
          name: user.name,
        },
      },
    })
    await posthog.shutdown()
  }
  return user
}
