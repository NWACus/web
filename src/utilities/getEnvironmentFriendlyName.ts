export function getEnvironmentFriendlyName() {
  if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL_ENV) {
    return 'local'
  }

  if (process.env.VERCEL_ENV === 'preview') {
    if (process.env.VERCEL_GIT_COMMIT_REF === 'main') {
      return 'dev'
    }

    return 'preview'
  }

  if (process.env.VERCEL_ENV === 'production') {
    return 'prod'
  }

  return 'unknown'
}
