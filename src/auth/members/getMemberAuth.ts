import { deleteMemberRows } from '@/collections/Members/deleteMemberRows'
import { PROTOCOL } from '@/utilities/domain'
import { expo } from '@better-auth/expo'
import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { anonymous, emailOTP } from 'better-auth/plugins'
import type { Payload } from 'payload'
import { sendMemberDeleteAccount, sendMemberOtp } from './emails'
import { APEX_ORIGIN, memberAuthAllowedHosts } from './hosts'
import { linkAnonymousMember } from './linkAnonymousMember'
import { deviceSignIn } from './plugins/deviceSignIn'
import { siteSession } from './plugins/siteSession'
import { MEMBER_AUTH_TABLES } from './schema'
import { FULL_SESSION_SCOPE } from './siteSessionPolicy'

const SIXTY_DAYS = 60 * 60 * 24 * 60
const ONE_DAY = 60 * 60 * 24

export type MemberAuth = ReturnType<typeof buildMemberAuth>

const instances = new WeakMap<Payload, MemberAuth>()

/** The Better Auth server for Members, built once per Payload instance (it needs its Drizzle db). */
export function getMemberAuth(payload: Payload): MemberAuth {
  let auth = instances.get(payload)
  if (!auth) {
    auth = buildMemberAuth(payload)
    instances.set(payload, auth)
  }
  return auth
}

/** Web, iOS, Android and preview-Android OAuth clients all issue idTokens Better Auth must accept. */
function googleClientIds(): string[] {
  return [
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_IOS_CLIENT_ID,
    process.env.GOOGLE_ANDROID_CLIENT_ID,
    process.env.GOOGLE_ANDROID_PREVIEW_CLIENT_ID,
  ].filter((id): id is string => !!id)
}

function buildMemberAuth(payload: Payload) {
  const { tables } = payload.db
  const google = googleClientIds()
  const rateLimitEnabled = process.env.MEMBER_AUTH_RATE_LIMIT !== 'false'

  return betterAuth({
    appName: 'Avy',
    basePath: '/api/auth',
    baseURL: {
      allowedHosts: memberAuthAllowedHosts(),
      fallback: APEX_ORIGIN,
      protocol: PROTOCOL,
    },
    // AvyApp's scheme: the expo plugin turns its `expo-origin` header into the Origin, which must be
    // trusted for any cookie-bearing POST (device register, OTP linking, sign-out). `exp://` is added
    // by the plugin itself in development only.
    trustedOrigins: ['avy://'],
    secret: process.env.BETTER_AUTH_SECRET || payload.secret,
    database: drizzleAdapter(payload.db.drizzle, {
      provider: 'sqlite',
      schema: {
        members: tables.members,
        session: tables[MEMBER_AUTH_TABLES.session],
        account: tables[MEMBER_AUTH_TABLES.account],
        verification: tables[MEMBER_AUTH_TABLES.verification],
        rateLimit: tables[MEMBER_AUTH_TABLES.rateLimit],
      },
    }),
    user: {
      modelName: 'members',
      deleteUser: {
        enabled: true,
        sendDeleteAccountVerification: async ({ user, url }) => {
          await sendMemberDeleteAccount(payload, user.email, url)
        },
        // Explicit, not via FK cascades: Turso ignores FK pragmas inside transactions.
        beforeDelete: async (user) => {
          await deleteMemberRows(payload, user.id)
        },
      },
    },
    session: {
      expiresIn: SIXTY_DAYS,
      updateAge: ONE_DAY,
      additionalFields: {
        scope: { type: 'string', defaultValue: FULL_SESSION_SCOPE, input: false },
        siteHost: { type: 'string', required: false, input: false },
      },
    },
    emailAndPassword: { enabled: false },
    socialProviders:
      google.length > 0 && process.env.GOOGLE_CLIENT_SECRET
        ? {
            google: {
              clientId: google,
              clientSecret: process.env.GOOGLE_CLIENT_SECRET,
              // The apex is Google's only redirect URI (ADR 026)
              redirectURI: `${APEX_ORIGIN}/api/auth/callback/google`,
            },
          }
        : undefined,
    rateLimit: {
      enabled: rateLimitEnabled,
      storage: 'database',
      modelName: 'rateLimit',
      window: 60,
      max: 100,
      customRules: {
        '/email-otp/send-verification-otp': { window: 60, max: 3 },
        '/sign-in/anonymous': { window: 60, max: 5 },
        '/sign-in/device': { window: 60, max: 10 },
      },
    },
    advanced: {
      cookiePrefix: 'avy',
      // Vercel sets x-forwarded-for to the client; rate limits key on it
      ipAddress: { ipAddressHeaders: ['x-forwarded-for'] },
    },
    databaseHooks: {
      user: {
        create: {
          // Hook point for PostHog identify/alias: Better Auth writes bypass Payload hooks.
          after: async (user) => {
            payload.logger.info(
              { memberId: user.id, anonymous: user.isAnonymous },
              'Member created',
            )
          },
        },
      },
    },
    plugins: [
      anonymous({
        emailDomainName: 'anonymous.avy-fx.org',
        onLinkAccount: async ({ anonymousUser, newUser }) => {
          await linkAnonymousMember(payload, anonymousUser.user.id, newUser.user.id)
        },
      }),
      emailOTP({
        otpLength: 6,
        expiresIn: 60 * 10,
        allowedAttempts: 5,
        sendVerificationOTP: async ({ email, otp, type }) => {
          await sendMemberOtp(payload, email, otp, type)
        },
      }),
      deviceSignIn(payload),
      siteSession(payload),
      // Forwards AvyApp's SecureStore cookie and trusts the app's scheme origin
      expo(),
    ],
  })
}
