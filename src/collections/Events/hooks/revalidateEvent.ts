import type { BasePayload, CollectionAfterChangeHook, CollectionAfterDeleteHook } from 'payload'

import { resolveTenant } from '@/utilities/tenancy/resolveTenant'
import { revalidatePath } from 'next/cache'

import type { Event } from '@/payload-types'
import { revalidateBlockReferences } from '@/utilities/revalidateBlockReferences'
import { revalidateRelationshipReferences } from '@/utilities/revalidateRelationshipReferences'

const revalidate = async ({
  docId,
  slug,
  tenantSlug,
  payload,
}: {
  docId: number
  slug: string
  tenantSlug: string
  payload: BasePayload
}) => {
  const preRewritePath = `/events/${slug}`
  const eventRewritePath = `/${tenantSlug}${preRewritePath}`

  payload.logger.info(`Revalidating paths: ${[preRewritePath, eventRewritePath].join(', ')}`)

  revalidatePath(preRewritePath)
  revalidatePath(eventRewritePath)

  await revalidateBlockReferences({
    collection: 'events',
    id: docId,
  })

  await revalidateRelationshipReferences({
    collection: 'events',
    id: docId,
  })
}

export const revalidateEvent: CollectionAfterChangeHook<Event> = async ({
  doc,
  previousDoc,
  req: { payload, context },
}) => {
  if (context.disableRevalidate) return

  const tenant = await resolveTenant(doc.tenant)

  if (doc._status === 'published') {
    revalidate({ docId: doc.id, slug: doc.slug, tenantSlug: tenant.slug, payload })
  }

  // If the event was previously published, and it is no longer published or the slug has changed
  // we need to revalidate the old path
  if (
    previousDoc._status === 'published' &&
    (doc._status !== 'published' || previousDoc.slug !== doc.slug)
  ) {
    payload.logger.info('Revalidating old event')
    revalidate({ docId: doc.id, slug: previousDoc.slug, tenantSlug: tenant.slug, payload })
  }
}

export const revalidateEventDelete: CollectionAfterDeleteHook<Event> = async ({
  doc,
  req: { payload, context },
}) => {
  if (context.disableRevalidate) return

  const tenant = await resolveTenant(doc.tenant)

  revalidate({ docId: doc.id, slug: doc.slug, tenantSlug: tenant.slug, payload })
}
