import type { Payload } from 'payload'

export type SubscriptionKey = { tenant: number; zone: string; category: string; channel: string }

export const subscriptionKey = (sub: SubscriptionKey) =>
  `${sub.tenant}|${sub.zone}|${sub.category}|${sub.channel}`

const tenantId = (tenant: number | { id: number }) =>
  typeof tenant === 'number' ? tenant : tenant.id

/**
 * Moves an Anonymous Member's rows to the Member it just linked to (ADR 026): Devices and
 * Deliveries move wholesale; Subscriptions are unioned, deduped on center × zone × category ×
 * channel; a Membership moves unless the linked Member already has one with that center.
 * Better Auth deletes the Anonymous Member afterwards (sessions and accounts included).
 */
export async function linkAnonymousMember(payload: Payload, anonymousId: string, linkedId: string) {
  if (anonymousId === linkedId) return

  for (const collection of ['devices', 'deliveries'] as const) {
    await payload.update({
      collection,
      where: { member: { equals: anonymousId } },
      data: { member: linkedId },
      depth: 0,
    })
  }

  const [linkedSubs, anonSubs] = await Promise.all(
    [linkedId, anonymousId].map((member) =>
      payload.find({
        collection: 'subscriptions',
        where: { member: { equals: member } },
        pagination: false,
        depth: 0,
      }),
    ),
  )
  const existing = new Set(
    linkedSubs.docs.map((s) => subscriptionKey({ ...s, tenant: tenantId(s.tenant) })),
  )
  for (const sub of anonSubs.docs) {
    const key = subscriptionKey({ ...sub, tenant: tenantId(sub.tenant) })
    if (existing.has(key)) {
      await payload.delete({ collection: 'subscriptions', id: sub.id, depth: 0 })
    } else {
      await payload.update({
        collection: 'subscriptions',
        id: sub.id,
        data: { member: linkedId },
        depth: 0,
      })
      existing.add(key)
    }
  }

  const [linkedMemberships, anonMemberships] = await Promise.all(
    [linkedId, anonymousId].map((member) =>
      payload.find({
        collection: 'memberships',
        where: { member: { equals: member } },
        pagination: false,
        depth: 0,
      }),
    ),
  )
  const linkedTenants = new Set(linkedMemberships.docs.map((m) => tenantId(m.tenant)))
  for (const membership of anonMemberships.docs) {
    if (linkedTenants.has(tenantId(membership.tenant))) {
      await payload.delete({ collection: 'memberships', id: membership.id, depth: 0 })
    } else {
      await payload.update({
        collection: 'memberships',
        id: membership.id,
        data: { member: linkedId },
        depth: 0,
      })
    }
  }
}
