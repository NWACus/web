import { PostHog } from 'posthog-node'

// NOTE: This is a Node.js client, so you can use it for sending events from the server side to PostHog.
export default function PostHogClient() {
  if (process.env.NEXT_PUBLIC_POSTHOG_KEY) {
    const postHogApiKey = process.env.NEXT_PUBLIC_POSTHOG_KEY

    const posthogClient = new PostHog(postHogApiKey, {
      host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.posthog.com',
      flushAt: 1,
      flushInterval: 0,
    })

    return posthogClient
  }

  return null
}
