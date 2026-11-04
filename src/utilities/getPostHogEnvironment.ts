export type PostHogEnvironment = 'production' | 'preview' | 'development' | 'local'

/**
 * Environment label shared with AvyApp's PostHog events. Reads the `NEXT_PUBLIC_` copies of
 * Vercel's system variables because Next only inlines `NEXT_PUBLIC_` values into the browser bundle.
 */
export function getPostHogEnvironment(): PostHogEnvironment {
  const vercelEnv = process.env.NEXT_PUBLIC_VERCEL_ENV

  if (vercelEnv === 'production') {
    return 'production'
  }

  if (vercelEnv === 'preview') {
    // Previews of main are the deployed dev environment (*.dev.avy-fx.org)
    return process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_REF === 'main' ? 'development' : 'preview'
  }

  return 'local'
}
