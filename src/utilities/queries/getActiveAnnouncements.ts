import type { Announcement } from '@/payload-types'
import configPromise from '@payload-config'
import type { Where } from 'payload'
import { getPayload } from 'payload'

const MAX_BANNERS = 3

export interface ActiveAnnouncements {
  banners: Announcement[]
  popups: Announcement[]
}

// Uncached, because "active" depends on the clock. Read it from the
// /api/[center]/announcements route, never while rendering a page: see docs/revalidation.md.
export async function getActiveAnnouncements(center: string): Promise<ActiveAnnouncements> {
  const payload = await getPayload({ config: configPromise })
  const now = new Date().toISOString()

  const conditions: Where[] = [
    { 'tenant.slug': { equals: center } },
    { _status: { equals: 'published' } },
    {
      or: [{ startDate: { less_than_equal: now } }, { startDate: { exists: false } }],
    },
    {
      or: [{ endDate: { greater_than_equal: now } }, { endDate: { exists: false } }],
    },
  ]

  const result = await payload.find({
    collection: 'announcements',
    where: { and: conditions },
    sort: '-publishedAt',
    depth: 2,
    limit: 20,
  })

  const banners = result.docs.filter((doc) => doc.type === 'banner').slice(0, MAX_BANNERS)
  const popups = result.docs.filter((doc) => doc.type === 'popup')

  return { banners, popups }
}
