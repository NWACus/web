export const PROTOCOL =
  process.env.NODE_ENV === 'production' &&
  process.env.LOCAL_FLAG_ENABLE_LOCAL_PRODUCTION_BUILDS !== 'true'
    ? 'https'
    : 'http'
export const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'localhost:3000'
export const ROOT_SITE_URL = `${PROTOCOL}://${ROOT_DOMAIN}`
