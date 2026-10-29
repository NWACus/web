import type { BetterAuthPlugin } from 'better-auth'
import { APIError, createAuthEndpoint, sessionMiddleware } from 'better-auth/api'
import { setSessionCookie } from 'better-auth/cookies'
import { createHash, timingSafeEqual } from 'node:crypto'
import type { Payload } from 'payload'
import * as z from 'zod'

export const hashDeviceSecret = (secret: string) =>
  createHash('sha256').update(secret).digest('hex')

function secretMatches(secret: string, storedHash: string | null | undefined): boolean {
  if (!storedHash) return false
  const a = Buffer.from(hashDeviceSecret(secret), 'hex')
  const b = Buffer.from(storedHash, 'hex')
  return a.length === b.length && timingSafeEqual(a, b)
}

const PLATFORMS = ['ios', 'android'] as const

/** The Member a device belongs to, if the install id exists and the secret matches its hash. */
async function memberIdForDevice(payload: Payload, installId: string, secret: string) {
  const { docs } = await payload.find({
    collection: 'devices',
    where: { installId: { equals: installId } },
    limit: 1,
    depth: 0,
  })
  const device = docs[0]
  if (!device || !secretMatches(secret, device.secretHash)) return null
  return typeof device.member === 'string' ? device.member : (device.member?.id ?? null)
}

/**
 * Device-bound sign-in for Anonymous Members (ADR 026). `/device/register` binds an install to the
 * signed-in Member and stores a hash of its secret; `/sign-in/device` trades the secret for a fresh
 * session, and refuses once the Member is linked.
 */
export const deviceSignIn = (payload: Payload): BetterAuthPlugin => ({
  id: 'device-sign-in',
  endpoints: {
    registerDevice: createAuthEndpoint(
      '/device/register',
      {
        method: 'POST',
        body: z.object({
          installId: z.string().min(8).max(128),
          secret: z.string().min(16).max(256),
          pushToken: z.string().max(512).optional(),
          platform: z.enum(PLATFORMS).optional(),
        }),
        use: [sessionMiddleware],
      },
      async (ctx) => {
        const memberId = ctx.context.session.user.id
        const data = {
          member: memberId,
          secretHash: hashDeviceSecret(ctx.body.secret),
          pushToken: ctx.body.pushToken,
          platform: ctx.body.platform,
        }
        const { docs } = await payload.find({
          collection: 'devices',
          where: { installId: { equals: ctx.body.installId } },
          limit: 1,
          depth: 0,
        })
        const device = docs[0]
          ? await payload.update({ collection: 'devices', id: docs[0].id, data, depth: 0 })
          : await payload.create({
              collection: 'devices',
              data: { ...data, installId: ctx.body.installId },
              depth: 0,
            })
        return ctx.json({ device: { id: device.id, installId: device.installId } })
      },
    ),

    signInDevice: createAuthEndpoint(
      '/sign-in/device',
      {
        method: 'POST',
        body: z.object({
          installId: z.string().min(8).max(128),
          secret: z.string().min(16).max(256),
        }),
      },
      async (ctx) => {
        const memberId = await memberIdForDevice(payload, ctx.body.installId, ctx.body.secret)
        if (!memberId) throw new APIError('UNAUTHORIZED', { message: 'Unknown device or secret' })
        const [member, memberDoc] = await Promise.all([
          ctx.context.internalAdapter.findUserById(memberId),
          payload.findByID({ collection: 'members', id: memberId, depth: 0, disableErrors: true }),
        ])
        if (!member || !memberDoc) {
          throw new APIError('UNAUTHORIZED', { message: 'Unknown device or secret' })
        }
        if (!memberDoc.isAnonymous) {
          throw new APIError('FORBIDDEN', {
            message: 'This Member is linked; sign in with email or Google instead',
          })
        }
        const session = await ctx.context.internalAdapter.createSession(member.id)
        await setSessionCookie(ctx, { session, user: member })
        return ctx.json({ token: session.token, user: member })
      },
    ),
  },
  rateLimit: [{ pathMatcher: (path) => path === '/sign-in/device', window: 60, max: 10 }],
})
