import { getMemberAuth } from '@/auth/members/getMemberAuth'
import type { AuthStrategy } from 'payload'

// Better Auth's cookie is `<prefix>.session_token`, `__Secure-` prefixed on https.
const MEMBER_SESSION_COOKIE = /(?:^|;\s*)(?:__Secure-)?avy\.session_token=/
const PAYLOAD_TOKEN_COOKIE = /(?:^|;\s*)payload-token=/

/**
 * Payload runs every auth collection's strategies on every request and its own JWT strategy last,
 * so this one yields whenever admin credentials are present: on admin and API routes a staff
 * session always wins, and a Member session never reaches the admin.
 */
function hasAdminCredentials(headers: Headers): boolean {
  const cookie = headers.get('cookie') ?? ''
  if (PAYLOAD_TOKEN_COOKIE.test(cookie)) return true
  const authorization = headers.get('authorization') ?? ''
  return authorization.startsWith('JWT ') || authorization.includes(' API-Key ')
}

export const memberSessionStrategy: AuthStrategy = {
  name: 'member-session',
  authenticate: async ({ headers, payload }) => {
    const cookie = headers.get('cookie') ?? ''
    if (!MEMBER_SESSION_COOKIE.test(cookie) || hasAdminCredentials(headers)) {
      return { user: null }
    }

    const session = await getMemberAuth(payload).api.getSession({ headers })
    if (!session) return { user: null }

    const member = await payload.findByID({
      collection: 'members',
      id: session.user.id,
      depth: 0,
      disableErrors: true,
    })
    if (!member) return { user: null }

    return { user: { ...member, collection: 'members', _strategy: 'member-session' } }
  },
}
