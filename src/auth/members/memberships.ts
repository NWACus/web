import type { Membership } from '@/payload-types'
import type { Payload } from 'payload'
import { findCenterByHost } from './hosts'

/** The Member's Membership with the center a host belongs to, if any. */
export async function findCenterMembership(
  payload: Payload,
  memberId: string,
  host: string,
): Promise<Membership | null> {
  const slug = findCenterByHost(host)
  if (!slug) return null
  const { docs } = await payload.find({
    collection: 'memberships',
    where: { and: [{ member: { equals: memberId } }, { 'tenant.slug': { equals: slug } }] },
    limit: 1,
    depth: 0,
  })
  return docs[0] ?? null
}

/**
 * Signing in on a center's site is a Membership (ADR 026): the first site session on a host
 * records a `free` Membership with that center, so its admins can see the Member.
 */
export async function ensureCenterMembership(
  payload: Payload,
  memberId: string,
  host: string,
): Promise<Membership | null> {
  const existing = await findCenterMembership(payload, memberId, host)
  if (existing) return existing
  const slug = findCenterByHost(host)
  if (!slug) return null
  const { docs } = await payload.find({
    collection: 'tenants',
    where: { slug: { equals: slug } },
    limit: 1,
    depth: 0,
  })
  const tenant = docs[0]
  if (!tenant) return null
  return payload.create({
    collection: 'memberships',
    data: { member: memberId, tenant: tenant.id, kind: 'free' },
    depth: 0,
  })
}
