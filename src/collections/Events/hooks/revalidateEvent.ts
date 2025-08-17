import type { CollectionAfterChangeHook, CollectionAfterDeleteHook } from 'payload'

import { revalidateTag } from 'next/cache'

import type { Event } from '@/payload-types'

export const revalidateEvent: CollectionAfterChangeHook<Event> = ({
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
      // Revalidate events listing page
      revalidateTag(`events-${tenant.slug}`)

      // Revalidate single event page
      revalidateTag(`event-${doc.slug}`)

      // Revalidate related event group pages
      if (doc.eventGroups && Array.isArray(doc.eventGroups)) {
        doc.eventGroups.forEach((group) => {
          const groupSlug = typeof group === 'object' && group?.slug ? group.slug : null
          if (groupSlug) {
            revalidateTag(`event-group-${groupSlug}`)
          }
        })
      }

      // If slug changed, revalidate old paths too
      if (previousDoc && previousDoc.slug !== doc.slug) {
        revalidateTag(`event-${previousDoc.slug}`)
      }

      // If event groups changed, revalidate old group pages
      if (previousDoc?.eventGroups && Array.isArray(previousDoc.eventGroups)) {
        previousDoc.eventGroups.forEach((group) => {
          const groupSlug = typeof group === 'object' && group?.slug ? group.slug : null
          if (groupSlug) {
            revalidateTag(`event-group-${groupSlug}`)
          }
        })
      }
    }
  }

  return doc
}

export const revalidateDelete: CollectionAfterDeleteHook<Event> = ({ doc, req }) => {
  // Skip revalidation if disabled in context (e.g., during seeding)
  if (req.context?.disableRevalidate) {
    return doc
  }

  const tenant = typeof doc.tenant === 'object' ? doc.tenant : null

  if (tenant?.slug) {
    revalidateTag(`events-${tenant.slug}`)
    revalidateTag(`event-${doc.slug}`)

    // Revalidate related event group pages
    if (doc.eventGroups && Array.isArray(doc.eventGroups)) {
      doc.eventGroups.forEach((group) => {
        const groupSlug = typeof group === 'object' && group?.slug ? group.slug : null
        if (groupSlug) {
          revalidateTag(`event-group-${groupSlug}`)
        }
      })
    }
  }

  return doc
}
