import type { CollectionAfterChangeHook, CollectionAfterDeleteHook } from 'payload'

import { revalidateTag } from 'next/cache'

import type { EventGroup } from '@/payload-types'

export const revalidateEventGroup: CollectionAfterChangeHook<EventGroup> = ({
  doc,
  previousDoc,
  req: { payload, context },
}) => {
  // Skip revalidation if disabled in context (e.g., during seeding)
  if (context?.disableRevalidate) {
    return doc
  }

  if (doc._status === 'published') {
    const tenant = typeof doc.tenant === 'object' ? doc.tenant : null

    if (tenant?.slug) {
      // Revalidate the group's custom page
      revalidateTag(`event-group-${doc.slug}`)

      // Revalidate events listing (for filter updates)
      revalidateTag(`events-${tenant.slug}`)

      // If slug changed, revalidate old paths too
      if (previousDoc && previousDoc.slug !== doc.slug) {
        revalidateTag(`event-group-${previousDoc.slug}`)
      }
    }
  }

  return doc
}

export const revalidateDelete: CollectionAfterDeleteHook<EventGroup> = ({ doc, req }) => {
  // Skip revalidation if disabled in context (e.g., during seeding)
  if (req.context?.disableRevalidate) {
    return doc
  }

  const tenant = typeof doc.tenant === 'object' ? doc.tenant : null

  if (tenant?.slug) {
    revalidateTag(`event-group-${doc.slug}`)
    revalidateTag(`events-${tenant.slug}`)
  }

  return doc
}
