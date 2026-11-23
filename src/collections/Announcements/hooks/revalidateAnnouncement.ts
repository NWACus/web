import type { CollectionAfterChangeHook, CollectionAfterDeleteHook, PayloadRequest } from 'payload'

import type { Announcement } from '@/payload-types'
import { resolveTenant } from '@/utilities/tenancy/resolveTenant'
import { revalidatePath } from 'next/cache'

// Purges the cached /api/[center]/announcements answer, so a save shows before its 60s window.
async function revalidateAnnouncementsRoute(doc: Announcement, req: PayloadRequest) {
  if (req.context.disableRevalidate) return

  const tenant = await resolveTenant(doc.tenant)

  req.payload.logger.info(`Revalidating announcements for tenant: ${tenant.slug}`)
  revalidatePath(`/api/${tenant.slug}/announcements`)
}

export const revalidateAnnouncement: CollectionAfterChangeHook<Announcement> = ({ doc, req }) =>
  revalidateAnnouncementsRoute(doc, req)

export const revalidateAnnouncementDelete: CollectionAfterDeleteHook<Announcement> = ({
  doc,
  req,
}) => revalidateAnnouncementsRoute(doc, req)
