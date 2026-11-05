const POSTHOG_ENVIRONMENTS = ['production', 'preview', 'development', 'local'] as const

export type PostHogEnvironment = (typeof POSTHOG_ENVIRONMENTS)[number]

function isPostHogEnvironment(value: string | undefined): value is PostHogEnvironment {
  return POSTHOG_ENVIRONMENTS.some((environment) => environment === value)
}

/**
 * Environment label shared with AvyApp's PostHog events, set per Vercel environment. Vercel's own
 * `VERCEL_ENV` is server-only and our CLI builds never get the `NEXT_PUBLIC_` copies.
 */
export function getPostHogEnvironment(): PostHogEnvironment {
  const environment = process.env.NEXT_PUBLIC_POSTHOG_ENVIRONMENT
  return isPostHogEnvironment(environment) ? environment : 'local'
}
