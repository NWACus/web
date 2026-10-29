import { PROTOCOL } from '@/utilities/domain'
import type { BetterAuthPlugin } from 'better-auth'
import {
  APIError,
  createAuthEndpoint,
  createAuthMiddleware,
  getSessionFromCtx,
  sessionMiddleware,
} from 'better-auth/api'
import { setSessionCookie } from 'better-auth/cookies'
import { createHash, randomBytes } from 'node:crypto'
import type { Payload } from 'payload'
import * as z from 'zod'
import { APEX_ORIGIN, isApexHost, isCenterHost } from '../hosts'
import {
  FULL_SESSION_SCOPE,
  HANDOFF_TOKEN_TTL_SECONDS,
  isAccountPath,
  isSiteSafePath,
  safeLocalPath,
  SITE_MEMBER_MARKER_COOKIE,
  SITE_MEMBER_MARKER_MAX_AGE,
  SITE_SESSION_SCOPE,
  validateReturnTo,
} from '../siteSessionPolicy'

const handoffIdentifier = (token: string) =>
  `site-session:${createHash('sha256').update(token).digest('hex')}`

/** Host of the request as Better Auth resolved it against `allowedHosts`. */
function requestHost(baseURL: string): string {
  return new URL(baseURL).host
}

function markerCookie(
  ctx: { setCookie: (name: string, value: string, opts: object) => void },
  on: boolean,
) {
  ctx.setCookie(SITE_MEMBER_MARKER_COOKIE, on ? '1' : '', {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    secure: PROTOCOL === 'https',
    maxAge: on ? SITE_MEMBER_MARKER_MAX_AGE : 0,
  })
}

/**
 * Hands a signed-in apex Member a limited session on a center host (ADR 026):
 *   center "Sign in" → GET apex /site-session/handoff?returnTo=<center url>
 *     → 302 center /site-session/exchange?token=…&returnTo=<path> → 302 <path>, cookie set.
 * The before hook keeps every other endpoint apex-only.
 */
export const siteSession = (payload: Payload): BetterAuthPlugin => ({
  id: 'site-session',
  endpoints: {
    siteSessionHandoff: createAuthEndpoint(
      '/site-session/handoff',
      {
        method: 'GET',
        query: z.object({ returnTo: z.string(), silent: z.string().optional() }),
      },
      async (ctx) => {
        if (!isApexHost(requestHost(ctx.context.baseURL))) {
          throw new APIError('NOT_FOUND', { message: 'Hand-offs start on the apex' })
        }
        const returnTo = validateReturnTo(ctx.query.returnTo, PROTOCOL)
        if (!returnTo) {
          throw new APIError('BAD_REQUEST', { message: 'returnTo must be a center host URL' })
        }
        const exchange = new URL('/api/auth/site-session/exchange', returnTo.origin)
        exchange.searchParams.set('returnTo', `${returnTo.pathname}${returnTo.search}`)

        const session = await getSessionFromCtx(ctx)
        if (!session || session.session.scope !== FULL_SESSION_SCOPE) {
          if (ctx.query.silent) {
            exchange.searchParams.set('clear', '1')
            throw ctx.redirect(exchange.toString())
          }
          const signIn = new URL('/members/sign-in', APEX_ORIGIN)
          signIn.searchParams.set('returnTo', ctx.request?.url ?? returnTo.toString())
          throw ctx.redirect(signIn.toString())
        }

        const token = randomBytes(32).toString('base64url')
        await ctx.context.internalAdapter.createVerificationValue({
          identifier: handoffIdentifier(token),
          value: JSON.stringify({ userId: session.user.id, host: returnTo.host }),
          expiresAt: new Date(Date.now() + HANDOFF_TOKEN_TTL_SECONDS * 1000),
        })
        exchange.searchParams.set('token', token)
        throw ctx.redirect(exchange.toString())
      },
    ),

    siteSessionExchange: createAuthEndpoint(
      '/site-session/exchange',
      {
        method: 'GET',
        query: z.object({
          token: z.string().optional(),
          returnTo: z.string().optional(),
          clear: z.string().optional(),
        }),
      },
      async (ctx) => {
        const host = requestHost(ctx.context.baseURL)
        if (!isCenterHost(host)) {
          throw new APIError('NOT_FOUND', { message: 'Site sessions live on center hosts' })
        }
        const back = new URL(safeLocalPath(ctx.query.returnTo), `${PROTOCOL}://${host}`).toString()

        if (ctx.query.clear) {
          markerCookie(ctx, false)
          throw ctx.redirect(back)
        }
        if (!ctx.query.token) {
          throw new APIError('BAD_REQUEST', { message: 'token is required' })
        }

        // Consumed atomically: a hand-off token is good for exactly one exchange
        const verification = await ctx.context.internalAdapter.consumeVerificationValue(
          handoffIdentifier(ctx.query.token),
        )
        if (!verification || verification.expiresAt < new Date()) {
          throw new APIError('UNAUTHORIZED', { message: 'Hand-off token is invalid or expired' })
        }
        const parsed = z
          .object({ userId: z.string(), host: z.string() })
          .parse(JSON.parse(verification.value))
        if (parsed.host !== host) {
          throw new APIError('UNAUTHORIZED', { message: 'Hand-off token is for another host' })
        }
        const user = await ctx.context.internalAdapter.findUserById(parsed.userId)
        if (!user) throw new APIError('UNAUTHORIZED', { message: 'Member no longer exists' })

        // overrideAll: additionalFields defaults (scope 'full') are applied after a plain override
        const session = await ctx.context.internalAdapter.createSession(
          user.id,
          undefined,
          { scope: SITE_SESSION_SCOPE, siteHost: host },
          true,
        )
        await setSessionCookie(ctx, { session, user })
        markerCookie(ctx, true)
        throw ctx.redirect(back)
      },
    ),

    // The site-safe write a center page is allowed: a low-stakes, reversible preference.
    setMemberPreference: createAuthEndpoint(
      '/member-preferences/set',
      {
        method: 'POST',
        body: z.object({ key: z.string().min(1).max(64), value: z.unknown() }),
        use: [sessionMiddleware],
      },
      async (ctx) => {
        const memberId = ctx.context.session.user.id
        const member = await payload.findByID({ collection: 'members', id: memberId, depth: 0 })
        const current =
          member.preferences &&
          typeof member.preferences === 'object' &&
          !Array.isArray(member.preferences)
            ? member.preferences
            : {}
        const preferences = { ...current, [ctx.body.key]: ctx.body.value }
        await payload.update({
          collection: 'members',
          id: memberId,
          data: { preferences },
          depth: 0,
        })
        return ctx.json({ preferences })
      },
    ),

    getMemberPreferences: createAuthEndpoint(
      '/member-preferences/get',
      { method: 'GET', use: [sessionMiddleware] },
      async (ctx) => {
        const member = await payload.findByID({
          collection: 'members',
          id: ctx.context.session.user.id,
          depth: 0,
        })
        return ctx.json({ preferences: member.preferences ?? {} })
      },
    ),
  },
  hooks: {
    before: [
      {
        matcher: () => true,
        handler: createAuthMiddleware(async (ctx) => {
          const host = requestHost(ctx.context.baseURL)
          if (!isApexHost(host) && !isSiteSafePath(ctx.path)) {
            throw new APIError('FORBIDDEN', {
              message: 'This endpoint is only available on the apex',
            })
          }
          // Defense in depth: a site session never reaches account endpoints, whatever the host.
          if (isAccountPath(ctx.path)) {
            const session = await getSessionFromCtx(ctx, { disableRefresh: true })
            if (session?.session.scope === SITE_SESSION_SCOPE) {
              throw new APIError('FORBIDDEN', {
                message: 'Site sessions cannot manage the account',
              })
            }
          }
        }),
      },
    ],
    after: [
      {
        matcher: (ctx) => ctx.path === '/sign-out',
        handler: createAuthMiddleware(async (ctx) => {
          if (isCenterHost(requestHost(ctx.context.baseURL))) markerCookie(ctx, false)
        }),
      },
    ],
  },
  rateLimit: [{ pathMatcher: (path) => path === '/site-session/exchange', window: 60, max: 20 }],
})
