import type { CollectionAfterChangeHook, CollectionAfterDeleteHook } from 'payload'

import { revalidateTag } from 'next/cache'

import type { EventType } from '@/payload-types'

export const revalidateEventType: CollectionAfterChangeHook<EventType> = ({
  doc,
  previousDoc,
  req: { payload, context },
}) => {
  // Skip revalidation if disabled in context (e.g., during seeding)
  if (context?.disableRevalidate) {
    return doc
  }

  const tenant = typeof doc.tenant === 'object' ? doc.tenant : null

  if (tenant?.slug) {
    // Revalidate events listing page (for filter updates)
    revalidateTag(`events-${tenant.slug}`)

    // If slug changed, revalidate old paths too
    if (previousDoc && previousDoc.slug !== doc.slug) {
      revalidateTag(`event-type-${previousDoc.slug}`)
    }

    revalidateTag(`event-type-${doc.slug}`)
  }

  return doc
}

export const revalidateDelete: CollectionAfterDeleteHook<EventType> = ({ doc, req }) => {
  // Skip revalidation if disabled in context (e.g., during seeding)
  if (req.context?.disableRevalidate) {
    return doc
  }

  const tenant = typeof doc.tenant === 'object' ? doc.tenant : null

  if (tenant?.slug) {
    revalidateTag(`events-${tenant.slug}`)
    revalidateTag(`event-type-${doc.slug}`)
  }

  return doc
}
