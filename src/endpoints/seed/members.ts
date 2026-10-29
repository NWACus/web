import type { Tenant } from '@/payload-types'
import type { ValidTenantSlug } from '@/utilities/tenancy/avalancheCenters'
import type { Payload } from 'payload'

type SeedSubscription = {
  tenant: ValidTenantSlug
  zone: string
  category: 'forecast' | 'warning'
  channel: 'push'
}

// Fixed ids so reseeding is idempotent; real Members get Better Auth generated ids.
const SEED_MEMBERS: {
  id: string
  email: string
  name: string
  isAnonymous: boolean
  memberships: ValidTenantSlug[]
  subscriptions: SeedSubscription[]
}[] = [
  {
    id: 'seedmembernwac000000000000000001',
    email: 'member@nwac.example',
    name: 'Nora Member',
    isAnonymous: false,
    memberships: ['nwac'],
    subscriptions: [{ tenant: 'nwac', zone: 'olympics', category: 'forecast', channel: 'push' }],
  },
  {
    id: 'seedmembersac0000000000000000001',
    email: 'member@sac.example',
    name: 'Sam Member',
    isAnonymous: false,
    memberships: ['sac'],
    subscriptions: [
      { tenant: 'sac', zone: 'central-sierra-nevada', category: 'warning', channel: 'push' },
    ],
  },
  {
    id: 'seedmemberanon000000000000000001',
    email: 'temp-seed@anonymous.avy-fx.org',
    name: 'Anonymous',
    isAnonymous: true,
    memberships: [],
    subscriptions: [
      { tenant: 'nwac', zone: 'west-slopes-central', category: 'forecast', channel: 'push' },
    ],
  },
]

async function upsertMember(payload: Payload, seed: (typeof SEED_MEMBERS)[number]) {
  const data = {
    id: seed.id,
    email: seed.email,
    name: seed.name,
    isAnonymous: seed.isAnonymous,
    emailVerified: !seed.isAnonymous,
  }
  const existing = await payload.findByID({
    collection: 'members',
    id: seed.id,
    depth: 0,
    disableErrors: true,
  })
  if (existing) {
    await payload.update({ collection: 'members', id: seed.id, data, depth: 0 })
  } else {
    await payload.create({ collection: 'members', data, depth: 0 })
  }
}

async function ensureMembership(payload: Payload, member: string, tenant: number) {
  const { totalDocs } = await payload.count({
    collection: 'memberships',
    where: { and: [{ member: { equals: member } }, { tenant: { equals: tenant } }] },
  })
  if (totalDocs === 0) {
    await payload.create({
      collection: 'memberships',
      data: { member, tenant, kind: 'signup' },
      depth: 0,
    })
  }
}

async function ensureSubscription(
  payload: Payload,
  member: string,
  tenant: number,
  sub: SeedSubscription,
) {
  const { totalDocs } = await payload.count({
    collection: 'subscriptions',
    where: {
      and: [
        { member: { equals: member } },
        { tenant: { equals: tenant } },
        { zone: { equals: sub.zone } },
        { category: { equals: sub.category } },
        { channel: { equals: sub.channel } },
      ],
    },
  })
  if (totalDocs === 0) {
    await payload.create({
      collection: 'subscriptions',
      data: { member, tenant, zone: sub.zone, category: sub.category, channel: sub.channel },
      depth: 0,
    })
  }
}

/** Members, Memberships and Subscriptions for the admin views and tenant-scoping checks. */
export async function seedMembers(payload: Payload, tenants: Tenant[]) {
  payload.logger.info('— Seeding members...')
  const tenantBySlug = new Map(tenants.map((tenant) => [tenant.slug, tenant.id]))
  const tenantId = (slug: ValidTenantSlug) => {
    const id = tenantBySlug.get(slug)
    if (id === undefined) throw new Error(`seedMembers: tenant ${slug} is not seeded`)
    return id
  }

  for (const seed of SEED_MEMBERS) {
    await upsertMember(payload, seed)
    for (const slug of seed.memberships) {
      await ensureMembership(payload, seed.id, tenantId(slug))
    }
    for (const sub of seed.subscriptions) {
      await ensureSubscription(payload, seed.id, tenantId(sub.tenant), sub)
    }
  }
}
