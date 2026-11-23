// Decides, in middleware, whether a center page view should bounce through the apex to renew an
// expired site session (ADR 026). Pure, so it can run at the edge and in unit tests.
import { APEX_ORIGIN, isCenterHost } from './hosts'
import { SESSION_COOKIE_PATTERN, SITE_MEMBER_MARKER_COOKIE } from './siteSessionPolicy'

const MARKER_PATTERN = new RegExp(
  `(?:^|;\\s*)${SITE_MEMBER_MARKER_COOKIE.replace('.', '\\.')}=1(?:;|$)`,
)

export type SilentReSignInInput = {
  host: string | null
  method: string
  url: string
  cookieHeader: string | null
  /** `purpose` / `sec-purpose` / `next-router-prefetch` style hints; prefetches never redirect. */
  isPrefetch: boolean
}

/**
 * Only a browser that has had a site session here (marker cookie) and has lost it (no session
 * cookie) is redirected. Everyone else, and every non-GET or prefetch, passes through.
 */
export function silentReSignInRedirect(input: SilentReSignInInput): URL | null {
  if (input.method !== 'GET' || input.isPrefetch) return null
  if (!isCenterHost(input.host)) return null
  const cookie = input.cookieHeader ?? ''
  if (!MARKER_PATTERN.test(cookie) || SESSION_COOKIE_PATTERN.test(cookie)) return null

  const handoff = new URL('/api/auth/site-session/handoff', APEX_ORIGIN)
  handoff.searchParams.set('returnTo', input.url)
  handoff.searchParams.set('silent', '1')
  return handoff
}
