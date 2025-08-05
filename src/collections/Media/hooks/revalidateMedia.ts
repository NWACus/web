import type { CollectionAfterChangeHook, CollectionAfterDeleteHook } from 'payload'

import type { Media } from '@/payload-types'
import { revalidateBlockReferences } from '@/utilities/revalidateBlockReferences'
import { revalidateRelationshipReferences } from '@/utilities/revalidateRelationshipReferences'

export const revalidateMedia: CollectionAfterChangeHook<Media> = async ({
  doc,
  req: { context },
}) => {
  if (!context.disableRevalidate) {
    await revalidateBlockReferences({
      collection: 'media',
      id: doc.id,
    })
    await revalidateRelationshipReferences({
      collection: 'media',
      id: doc.id,
    })
  }
  return doc
}

export const revalidateDelete: CollectionAfterDeleteHook<Media> = async ({
  doc,
  req: { context },
}) => {
  if (!context.disableRevalidate) {
    await revalidateBlockReferences({
      collection: 'media',
      id: doc.id,
    })
    await revalidateRelationshipReferences({
      collection: 'media',
      id: doc.id,
    })
  }
  return doc
}
