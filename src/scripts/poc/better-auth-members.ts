/**
 * POC 1 harness: proves Better Auth on a Payload-owned `members` collection end to end against a
 * scratch copy of the seeded dev database. Run with:
 *   cp dev.db .context/poc.db && DATABASE_URI=file:./.context/poc.db \
 *     NEXT_PUBLIC_ROOT_DOMAIN=localhost:55120 pnpm payload run src/scripts/poc/better-auth-members.ts
 */
import { getMemberAuth } from '@/auth/members/getMemberAuth'
import { hashDeviceSecret } from '@/auth/members/plugins/deviceSignIn'
import { MEMBER_AUTH_TABLES } from '@/auth/members/schema'
import configPromise from '@payload-config'
import { eq, sql } from '@payloadcms/db-sqlite/drizzle'
import assert from 'node:assert/strict'
import { randomBytes } from 'node:crypto'
import { getPayload, type SendEmailOptions } from 'payload'
import * as z from 'zod'

const APEX = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'localhost:3000'
const NWAC = `nwac.${APEX}`
const SAC = `sac.${APEX}`

const payload = await getPayload({ config: configPromise })
const auth = getMemberAuth(payload)

// Capture outgoing mail instead of sending it
const sentEmails: SendEmailOptions[] = []
payload.sendEmail = async (message) => {
  sentEmails.push(message)
  return {}
}

const step = (name: string) => payload.logger.info(`▶ ${name}`)
const rand = () => randomBytes(6).toString('hex')

async function call(
  host: string,
  path: string,
  init: {
    method?: string
    body?: unknown
    cookie?: string
    headers?: Record<string, string>
    /** Rate limits key on the client IP; vary it to keep scenarios independent. */
    ip?: string
  } = {},
) {
  const headers = new Headers({
    host,
    origin: `http://${host}`,
    'content-type': 'application/json',
    'x-forwarded-for': init.ip ?? '10.0.0.1',
    ...init.headers,
  })
  if (init.cookie) headers.set('cookie', init.cookie)
  const method = init.method ?? (init.body === undefined ? 'GET' : 'POST')
  const res = await auth.handler(
    new Request(`http://${host}/api/auth${path}`, {
      method,
      headers,
      body: init.body === undefined ? undefined : JSON.stringify(init.body),
      redirect: 'manual',
    }),
  )
  const text = await res.text()
  let json: Record<string, unknown> = {}
  try {
    json = JSON.parse(text)
  } catch {
    // not JSON
  }
  return {
    res,
    status: res.status,
    json,
    text,
    location: res.headers.get('location'),
    setCookie: res.headers.getSetCookie(),
  }
}

/** Path + query of a redirect Location, relative to the Better Auth base path, for `call()`. */
const authPath = (url: URL) => `${url.pathname.replace(/^\/api\/auth/, '')}${url.search}`

/** Cookie header built from the Set-Cookie values of a response (drops cleared cookies). */
function cookieHeader(setCookie: string[]): string {
  return setCookie
    .map((c) => c.split(';')[0])
    .filter((c) => !c.endsWith('='))
    .join('; ')
}

async function signInAnonymous(host = APEX) {
  const r = await call(host, '/sign-in/anonymous', { body: {} })
  assert.equal(r.status, 200, r.text)
  const user = r.json.user
  assert.ok(user && typeof user === 'object' && 'id' in user && typeof user.id === 'string')
  return { id: user.id, cookie: cookieHeader(r.setCookie) }
}

/** Sends an OTP and signs in with it, as the browser/app holding `cookie` would. */
async function signInWithOtp(email: string, cookie?: string) {
  const sendRes = await call(APEX, '/email-otp/send-verification-otp', {
    body: { email, type: 'sign-in' },
    cookie,
  })
  assert.equal(sendRes.status, 200, sendRes.text)
  const last = await waitForEmail(email)
  assert.ok(last && typeof last.subject === 'string', 'OTP email captured')
  const otp = last.subject.match(/^(\d{6}) is your Avy code$/)?.[1]
  assert.ok(otp, 'OTP in subject')
  const r = await call(APEX, '/sign-in/email-otp', { body: { email, otp }, cookie })
  assert.equal(r.status, 200, r.text)
  const user = r.json.user
  assert.ok(user && typeof user === 'object' && 'id' in user && typeof user.id === 'string')
  return { id: user.id, cookie: cookieHeader(r.setCookie) }
}

/** Better Auth sends mail as a background task after responding, so give it a moment. */
async function waitForEmail(to: string) {
  for (let i = 0; i < 50; i++) {
    const found = [...sentEmails].reverse().find((m) => m.to === to)
    if (found) return found
    await new Promise((r) => setTimeout(r, 20))
  }
  return undefined
}

const memberOrNull = (id: string) =>
  payload.findByID({ collection: 'members', id, depth: 0, disableErrors: true })

async function tenantId(slug: string) {
  const { docs } = await payload.find({
    collection: 'tenants',
    where: { slug: { equals: slug } },
    depth: 0,
  })
  assert.ok(docs[0], `tenant ${slug} is seeded`)
  return docs[0].id
}

async function sessionRowsFor(memberId: string) {
  const table = payload.db.tables[MEMBER_AUTH_TABLES.session]
  return payload.db.drizzle.select().from(table).where(eq(table.userId, memberId))
}

const nwacId = await tenantId('nwac')
const sacId = await tenantId('sac')

// ---------------------------------------------------------------------------------------------
step('(e) hybrid tables: Payload owns members, Better Auth tables injected via afterSchemaInit')
const tables = await payload.db.drizzle.all<{ name: string }>(
  sql`select name from sqlite_master where type = 'table' and name like 'members%' order by name`,
)
payload.logger.info({ tables: tables.map((t) => t.name) })
for (const name of Object.values(MEMBER_AUTH_TABLES)) {
  assert.ok(
    tables.some((t) => t.name === name),
    `${name} exists`,
  )
}

step('(e) Better Auth writes a Member that Payload reads back with ISO timestamps')
const anon0 = await signInAnonymous()
assert.match(anon0.cookie, /avy\.session_token=/)
const anon0Doc = await memberOrNull(anon0.id)
assert.ok(anon0Doc)
assert.equal(anon0Doc.isAnonymous, true)
assert.ok(!Number.isNaN(Date.parse(anon0Doc.createdAt)), 'createdAt parses')
assert.match(anon0Doc.createdAt, /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/)

step('(a) the Payload strategy resolves the Better Auth cookie to req.user on members')
const authed = await payload.auth({ headers: new Headers({ cookie: anon0.cookie, host: APEX }) })
assert.equal(authed.user?.collection, 'members')
assert.equal(authed.user?.id, anon0.id)

step('(c) admin credentials present → members strategy yields; a Member is never a User')
const mixed = await payload.auth({
  headers: new Headers({ cookie: `${anon0.cookie}; payload-token=not-a-real-jwt`, host: APEX }),
})
assert.equal(mixed.user, null)
assert.equal((await payload.auth({ headers: new Headers({ host: APEX }) })).user, null)
await assert.rejects(
  payload.find({ collection: 'users', user: authed.user, overrideAccess: false, depth: 0 }),
  (err: unknown) => err instanceof Error && 'status' in err && err.status === 403,
  'a Member session is forbidden from staff Users',
)

// ---------------------------------------------------------------------------------------------
step('(b) linking an Anonymous Member to a brand-new account moves its rows')
const anon1 = await signInAnonymous()
const d1 = { installId: `install-${rand()}`, secret: `secret-${rand()}${rand()}` }
const reg1 = await call(APEX, '/device/register', {
  body: { ...d1, platform: 'ios' },
  cookie: anon1.cookie,
})
assert.equal(reg1.status, 200, reg1.text)
await payload.create({
  collection: 'subscriptions',
  data: {
    member: anon1.id,
    tenant: nwacId,
    zone: 'olympics',
    category: 'forecast',
    channel: 'push',
  },
})
await payload.create({
  collection: 'memberships',
  data: { member: anon1.id, tenant: nwacId, kind: 'site' },
})
await payload.create({
  collection: 'deliveries',
  data: { member: anon1.id, title: 'Test delivery', sentAt: new Date().toISOString() },
})

const linkedEmail = `linked-${rand()}@example.com`
const linked = await signInWithOtp(linkedEmail, anon1.cookie)
assert.notEqual(linked.id, anon1.id)
assert.equal(await memberOrNull(anon1.id), null, 'Anonymous Member deleted after linking')
const linkedDoc = await memberOrNull(linked.id)
assert.ok(linkedDoc)
assert.equal(linkedDoc.isAnonymous, false)
assert.equal(linkedDoc.email, linkedEmail)
const d1Doc = (
  await payload.find({
    collection: 'devices',
    where: { installId: { equals: d1.installId } },
    depth: 0,
  })
).docs[0]
assert.equal(d1Doc?.member, linked.id, 'Device moved')
assert.equal(d1Doc?.secretHash, hashDeviceSecret(d1.secret))
const linkedSubs = await payload.find({
  collection: 'subscriptions',
  where: { member: { equals: linked.id } },
  depth: 0,
})
assert.equal(linkedSubs.totalDocs, 1, 'Subscription moved')
assert.equal(
  (
    await payload.find({
      collection: 'memberships',
      where: { member: { equals: linked.id } },
      depth: 0,
    })
  ).totalDocs,
  1,
)
assert.equal(
  (
    await payload.find({
      collection: 'deliveries',
      where: { member: { equals: linked.id } },
      depth: 0,
    })
  ).totalDocs,
  1,
)

step(
  '(b) linking to an existing account unions Subscriptions, deduped on center × zone × category × channel',
)
const anon2 = await signInAnonymous()
const d2 = { installId: `install-${rand()}`, secret: `secret-${rand()}${rand()}` }
assert.equal((await call(APEX, '/device/register', { body: d2, cookie: anon2.cookie })).status, 200)
await payload.create({
  collection: 'subscriptions',
  data: {
    member: anon2.id,
    tenant: nwacId,
    zone: 'olympics',
    category: 'forecast',
    channel: 'push',
  }, // duplicate
})
await payload.create({
  collection: 'subscriptions',
  data: { member: anon2.id, tenant: sacId, zone: 'tahoe', category: 'warning', channel: 'push' }, // new
})
await payload.create({
  collection: 'memberships',
  data: { member: anon2.id, tenant: nwacId, kind: 'donor' },
}) // duplicate center
const relinked = await signInWithOtp(linkedEmail, anon2.cookie)
assert.equal(relinked.id, linked.id, 'signed into the existing account')
assert.equal(await memberOrNull(anon2.id), null, 'second Anonymous Member deleted')
const unionSubs = await payload.find({
  collection: 'subscriptions',
  where: { member: { equals: linked.id } },
  depth: 0,
  sort: 'zone',
})
assert.deepEqual(
  unionSubs.docs.map((s) => s.zone),
  ['olympics', 'tahoe'],
)
assert.equal(
  (
    await payload.find({
      collection: 'subscriptions',
      where: { member: { equals: anon2.id } },
      depth: 0,
    })
  ).totalDocs,
  0,
)
assert.equal(
  (
    await payload.find({
      collection: 'memberships',
      where: { member: { equals: linked.id } },
      depth: 0,
    })
  ).totalDocs,
  1,
  'Membership deduped on center',
)
assert.equal(
  (
    await payload.find({
      collection: 'devices',
      where: { member: { equals: linked.id } },
      depth: 0,
    })
  ).totalDocs,
  2,
  'both Devices now owned by the Linked Member',
)
assert.equal((await sessionRowsFor(anon2.id)).length, 0, 'anonymous sessions deleted')

// ---------------------------------------------------------------------------------------------
step('(f) device sign-in: works for an Anonymous Member, refuses once linked, rejects bad secrets')
const refused = await call(APEX, '/sign-in/device', { body: d2 })
assert.equal(refused.status, 403, refused.text)
const anon3 = await signInAnonymous()
const d3 = { installId: `install-${rand()}`, secret: `secret-${rand()}${rand()}` }
assert.equal((await call(APEX, '/device/register', { body: d3, cookie: anon3.cookie })).status, 200)
const deviceSignIn = await call(APEX, '/sign-in/device', { body: d3 })
assert.equal(deviceSignIn.status, 200, deviceSignIn.text)
const deviceCookie = cookieHeader(deviceSignIn.setCookie)
const deviceSession = await call(APEX, '/get-session', { cookie: deviceCookie })
assert.equal(deviceSession.status, 200)
assert.equal(z.object({ id: z.string() }).parse(deviceSession.json.user).id, anon3.id)
const badSecret = await call(APEX, '/sign-in/device', {
  body: { ...d3, secret: `wrong-${d3.secret}` },
})
assert.equal(badSecret.status, 401)

// ---------------------------------------------------------------------------------------------
step('(d) a tenant admin only sees Members holding a Membership with their center')
const adminRole = (
  await payload.find({ collection: 'roles', where: { name: { equals: 'Admin' } }, depth: 0 })
).docs[0]
assert.ok(adminRole)
if (!adminRole.rules.some((rule) => rule.collections.includes('members'))) {
  await payload.update({
    collection: 'roles',
    id: adminRole.id,
    data: {
      rules: [
        ...adminRole.rules,
        { collections: ['members', 'memberships', 'subscriptions'], actions: ['*'] },
      ],
    },
  })
}
// Shaped like the JWT user Payload hands access control: joins populated one level deep.
// (A depth ≥ 3 find on users never resolves under `payload run`, with or without this POC.)
const staffUser = async (email: string) => {
  const { docs } = await payload.find({
    collection: 'users',
    where: { email: { equals: email } },
    depth: 0,
  })
  assert.ok(docs[0], `${email} is seeded`)
  const where = { user: { equals: docs[0].id } }
  const [roles, globalRoles] = await Promise.all([
    payload.find({ collection: 'roleAssignments', where, depth: 1, pagination: false }),
    payload.find({ collection: 'globalRoleAssignments', where, depth: 1, pagination: false }),
  ])
  return {
    ...docs[0],
    roles: { docs: roles.docs },
    globalRoleAssignments: { docs: globalRoles.docs },
    collection: 'users' as const,
  }
}
const nwacAdmin = await staffUser('admin@nwac.us')
const superAdmin = await staffUser('admin@avy.com')
const nwacView = await payload.find({
  collection: 'members',
  user: nwacAdmin,
  overrideAccess: false,
  depth: 0,
  pagination: false,
})
const nwacIds = nwacView.docs.map((m) => m.id)
assert.ok(nwacIds.includes(linked.id), 'sees the Member with an NWAC Membership')
assert.ok(!nwacIds.includes(anon3.id), 'does not see a Member with no Membership')
const sacOnly = await signInAnonymous()
await payload.create({
  collection: 'memberships',
  data: { member: sacOnly.id, tenant: sacId, kind: 'site' },
})
const nwacView2 = await payload.find({
  collection: 'members',
  user: nwacAdmin,
  overrideAccess: false,
  depth: 0,
  pagination: false,
})
assert.ok(!nwacView2.docs.some((m) => m.id === sacOnly.id), 'does not see a SAC-only Member')
const superView = await payload.find({
  collection: 'members',
  user: superAdmin,
  overrideAccess: false,
  depth: 0,
  pagination: false,
})
assert.ok(
  superView.docs.some((m) => m.id === sacOnly.id),
  'super admin sees everyone',
)
const memberSelf = await payload.find({
  collection: 'members',
  user: authed.user,
  overrideAccess: false,
  depth: 0,
})
assert.deepEqual(
  memberSelf.docs.map((m) => m.id),
  [anon0.id],
  'a Member reads only itself',
)

// ---------------------------------------------------------------------------------------------
step('(h) site sessions: apex hand-off → center exchange → limited session + marker cookie')
const full = await signInWithOtp(`site-${rand()}@example.com`)
const returnTo = `http://${NWAC}/forecasts/olympics?x=1`
const handoff = await call(APEX, `/site-session/handoff?returnTo=${encodeURIComponent(returnTo)}`, {
  cookie: full.cookie,
})
assert.equal(handoff.status, 302, handoff.text)
assert.ok(handoff.location, 'redirects')
const exchangeUrl = new URL(handoff.location)
assert.equal(exchangeUrl.host, NWAC)
assert.equal(exchangeUrl.pathname, '/api/auth/site-session/exchange')
assert.equal(exchangeUrl.searchParams.get('returnTo'), '/forecasts/olympics?x=1')
const exchange = await call(NWAC, authPath(exchangeUrl))
assert.equal(exchange.status, 302, exchange.text)
assert.equal(exchange.location, returnTo)
assert.ok(
  exchange.setCookie.some((c) => c.startsWith('avy.session_token=')),
  'site session cookie set on the center host',
)
assert.ok(
  exchange.setCookie.some((c) => c.startsWith('avy.site_member=1')),
  'marker cookie set',
)
const siteCookie = cookieHeader(exchange.setCookie)
const replay = await call(NWAC, authPath(exchangeUrl))
assert.equal(replay.status, 401, 'hand-off token is one-time')
const siteSession = await call(NWAC, '/get-session', { cookie: siteCookie })
assert.equal(siteSession.status, 200)
assert.equal(z.object({ scope: z.string() }).parse(siteSession.json.session).scope, 'site')
assert.equal(z.object({ id: z.string() }).parse(siteSession.json.user).id, full.id)

step('(h) a site session can write a preference and nothing account-related')
const pref = await call(NWAC, '/member-preferences/set', {
  body: { key: 'theme', value: 'dark' },
  cookie: siteCookie,
})
assert.equal(pref.status, 200, pref.text)
const fullDoc = await memberOrNull(full.id)
assert.deepEqual(fullDoc?.preferences, { theme: 'dark' })
for (const [path, body] of [
  ['/delete-user', {}],
  ['/change-email', { newEmail: 'x@example.com' }],
  ['/link-social', { provider: 'google' }],
  ['/list-sessions', undefined],
  ['/sign-in/anonymous', {}],
  ['/email-otp/send-verification-otp', { email: 'x@example.com', type: 'sign-in' }],
] as const) {
  const r = await call(NWAC, path, {
    body,
    cookie: siteCookie,
    method: body === undefined ? 'GET' : 'POST',
    ip: '10.0.0.2',
  })
  assert.equal(r.status, 403, `${path} refused on a center host: ${r.status} ${r.text}`)
}
const replayedScope = await call(APEX, '/list-sessions', { cookie: siteCookie })
assert.equal(
  replayedScope.status,
  403,
  'a site session token replayed at the apex is still refused',
)
const fullList = await call(APEX, '/list-sessions', { cookie: full.cookie })
assert.equal(fullList.status, 200, 'the full apex session can manage the account')

step('(h) returnTo is validated against the center list')
for (const bad of [
  'http://evil.example/',
  `http://${APEX}/`,
  'javascript:alert(1)',
  'https://localhost/x',
]) {
  const r = await call(APEX, `/site-session/handoff?returnTo=${encodeURIComponent(bad)}`, {
    cookie: full.cookie,
  })
  assert.equal(r.status, 400, `${bad} → ${r.status}`)
}
const sacHandoff = await call(
  APEX,
  `/site-session/handoff?returnTo=${encodeURIComponent(`http://${SAC}/`)}`,
  { cookie: full.cookie },
)
assert.equal(sacHandoff.status, 302)
const sacExchangeUrl = new URL(sacHandoff.location ?? '')
const wrongHost = await call(NWAC, authPath(sacExchangeUrl))
assert.equal(wrongHost.status, 401, 'a token minted for SAC is refused on NWAC')

step(
  '(h) silent re-sign-in: no apex session → bounce back and clear the marker; with session → new site session',
)
const silentNoSession = await call(
  APEX,
  `/site-session/handoff?returnTo=${encodeURIComponent(returnTo)}&silent=1`,
)
assert.equal(silentNoSession.status, 302)
const clearUrl = new URL(silentNoSession.location ?? '')
assert.equal(clearUrl.searchParams.get('clear'), '1')
const cleared = await call(NWAC, authPath(clearUrl), { cookie: 'avy.site_member=1' })
assert.equal(cleared.status, 302)
assert.equal(cleared.location, returnTo)
assert.ok(
  cleared.setCookie.some((c) => c.startsWith('avy.site_member=;') && /max-age=0/i.test(c)),
  'marker cleared',
)
const silentWithSession = await call(
  APEX,
  `/site-session/handoff?returnTo=${encodeURIComponent(returnTo)}&silent=1`,
  { cookie: full.cookie },
)
assert.equal(silentWithSession.status, 302)
assert.ok(
  new URL(silentWithSession.location ?? '').searchParams.get('token'),
  'silent hand-off mints a token',
)
const noSessionNotSilent = await call(
  APEX,
  `/site-session/handoff?returnTo=${encodeURIComponent(returnTo)}`,
)
assert.equal(noSessionNotSilent.status, 302)
assert.equal(
  new URL(noSessionNotSilent.location ?? '').pathname,
  '/members/sign-in',
  'interactive hand-off without a session goes to sign-in',
)

step('(h) signing out on a center host clears the marker')
const signOut = await call(NWAC, '/sign-out', { body: {}, cookie: siteCookie })
assert.equal(signOut.status, 200, signOut.text)
assert.ok(
  signOut.setCookie.some((c) => c.startsWith('avy.site_member=;')),
  'marker cleared on sign-out',
)

// ---------------------------------------------------------------------------------------------
step(
  '(g) deleteUser on the apex, confirmed by emailed link, removes the Member and its Payload rows',
)
assert.equal((await sessionRowsFor(linked.id)).length > 0, true)
const del = await call(APEX, '/delete-user', {
  body: { callbackURL: '/goodbye' },
  cookie: relinked.cookie,
})
assert.equal(del.status, 200, del.text)
assert.equal(
  (await memberOrNull(linked.id)) !== null,
  true,
  'not deleted until the link is clicked',
)
const deleteEmail = await waitForEmail(linkedEmail)
assert.ok(deleteEmail, 'delete confirmation email captured')
const confirmUrl = String(deleteEmail?.html)
  .match(/href="([^"]*delete-user\/callback[^"]*)"/)?.[1]
  ?.replace(/&amp;/g, '&')
assert.ok(confirmUrl, 'confirmation link in email')
const confirm = await call(APEX, authPath(new URL(confirmUrl)), { cookie: relinked.cookie })
assert.equal(confirm.status, 302, confirm.text)
assert.equal(await memberOrNull(linked.id), null, 'Member deleted')
for (const collection of ['devices', 'subscriptions', 'memberships', 'deliveries'] as const) {
  const left = await payload.find({
    collection,
    where: { member: { equals: linked.id } },
    depth: 0,
  })
  assert.equal(left.totalDocs, 0, `${collection} rows deleted explicitly`)
}
assert.equal((await sessionRowsFor(linked.id)).length, 0, 'sessions deleted')
const accounts = payload.db.tables[MEMBER_AUTH_TABLES.account]
assert.equal(
  (await payload.db.drizzle.select().from(accounts).where(eq(accounts.userId, linked.id))).length,
  0,
)

step('(g) deleting a Member in the admin (Payload) also removes Better Auth rows')
await payload.create({
  collection: 'devices',
  data: { installId: `install-${rand()}`, member: anon3.id },
})
assert.equal((await sessionRowsFor(anon3.id)).length > 0, true)
await payload.delete({ collection: 'members', id: anon3.id })
assert.equal((await sessionRowsFor(anon3.id)).length, 0)
assert.equal(
  (await payload.find({ collection: 'devices', where: { member: { equals: anon3.id } }, depth: 0 }))
    .totalDocs,
  0,
)

// ---------------------------------------------------------------------------------------------
step('rate limits are stored in the database and bite on OTP sends')
const rateRows = await payload.db.drizzle
  .select()
  .from(payload.db.tables[MEMBER_AUTH_TABLES.rateLimit])
assert.ok(rateRows.length > 0, 'rate limit rows persisted')
const statuses: number[] = []
for (let i = 0; i < 4; i++) {
  const r = await call(APEX, '/email-otp/send-verification-otp', {
    body: { email: `rl-${rand()}@example.com`, type: 'sign-in' },
    ip: '10.0.0.3',
  })
  statuses.push(r.status)
}
assert.deepEqual(statuses, [200, 200, 200, 429], 'OTP sends: 3 per minute per IP')

payload.logger.info('✅ POC 1 checks passed')
process.exit(0)
