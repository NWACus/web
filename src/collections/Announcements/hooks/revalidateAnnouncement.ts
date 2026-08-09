import type { CollectionAfterChangeHook, CollectionAfterDeleteHook } from 'payload'

import type { Announcement } from '@/payload-types'
import { resolveTenant } from '@/utilities/tenancy/resolveTenant'
import { revalidateTag } from 'next/cache'

export const revalidateAnnouncement: CollectionAfterChangeHook<Announcement> = async ({
  doc,
  req: { payload, context },
}) => {
  if (context.disableRevalidate) return

  const tenant = await resolveTenant(doc.tenant)

  payload.logger.info(`Revalidating announcements for tenant: ${tenant.slug}`)
  revalidateTag(`announcements-${tenant.slug}`)
}

export const revalidateAnnouncementDelete: CollectionAfterDeleteHook<Announcement> = async ({
  doc,
  req: { payload, context },
}) => {
  if (context.disableRevalidate) return

  const tenant = await resolveTenant(doc.tenant)

  payload.logger.info(`Revalidating announcements for deleted announcement, tenant: ${tenant.slug}`)
  revalidateTag(`announcements-${tenant.slug}`)
}
