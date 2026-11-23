// Pure rules for site sessions (ADR 026): which Better Auth paths a center host may answer, and
// what a hand-off may redirect back to. No Payload imports so middleware and tests can load it.
import { findCenterByHost, isApexHost } from './hosts'

export const SITE_SESSION_SCOPE = 'site'
export const FULL_SESSION_SCOPE = 'full'

/** Long-lived marker saying this browser has had a site session on this center host. */
export const SITE_MEMBER_MARKER_COOKIE = 'avy.site_member'
export const SITE_MEMBER_MARKER_MAX_AGE = 60 * 60 * 24 * 400

export const SESSION_COOKIE_PATTERN = /(?:^|;\s*)(?:__Secure-)?avy\.session_token=/

/** Hand-off token lifetime. One top-level redirect is all it has to survive. */
export const HANDOFF_TOKEN_TTL_SECONDS = 60

/** Paths a center host answers. Everything else is apex-only. */
export const SITE_SAFE_PATHS = new Set([
  '/get-session',
  '/sign-out',
  '/ok',
  '/error',
  '/site-session/exchange',
  '/member-preferences/get',
  '/member-preferences/set',
])

/** Account endpoints a site session may never use, even if it reaches the apex somehow. */
export const ACCOUNT_PATHS = new Set([
  '/delete-user',
  '/delete-user/callback',
  '/change-email',
  '/update-user',
  '/link-social',
  '/unlink-account',
  '/list-accounts',
  '/list-sessions',
  '/revoke-session',
  '/revoke-sessions',
  '/revoke-other-sessions',
  '/change-password',
  '/set-password',
])

export function isSiteSafePath(path: string): boolean {
  return SITE_SAFE_PATHS.has(path)
}

export function isAccountPath(path: string): boolean {
  return ACCOUNT_PATHS.has(path)
}

/**
 * A hand-off may only return to a center host, over the protocol the center list implies. Returns
 * the parsed URL or null.
 */
export function validateReturnTo(returnTo: string | undefined, protocol: string): URL | null {
  if (!returnTo) return null
  let url: URL
  try {
    url = new URL(returnTo)
  } catch {
    return null
  }
  if (url.protocol !== `${protocol}:`) return null
  if (url.username || url.password) return null
  if (isApexHost(url.host) || !findCenterByHost(url.host)) return null
  return url
}

/** The path a center host may redirect to after an exchange: same-host only, never `//host`. */
export function safeLocalPath(path: string | undefined): string {
  if (!path || !path.startsWith('/') || path.startsWith('//') || path.startsWith('/\\')) return '/'
  return path
}
