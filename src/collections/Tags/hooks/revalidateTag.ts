import type { CollectionAfterChangeHook, CollectionAfterDeleteHook } from 'payload'

import type { Tag } from '@/payload-types'
import { revalidateBlockReferences } from '@/utilities/revalidateBlockReferences'
import { revalidateRelationshipReferences } from '@/utilities/revalidateRelationshipReferences'

export const revalidateTag: CollectionAfterChangeHook<Tag> = async ({ doc, req: { context } }) => {
  if (!context.disableRevalidate) {
    await revalidateBlockReferences({
      collection: 'tags',
      id: doc.id,
    })
    await revalidateRelationshipReferences({
      collection: 'tags',
      id: doc.id,
    })
  }
  return doc
}

export const revalidateDelete: CollectionAfterDeleteHook<Tag> = async ({
  doc,
  req: { context },
}) => {
  if (!context.disableRevalidate) {
    await revalidateBlockReferences({
      collection: 'tags',
      id: doc.id,
    })
    await revalidateRelationshipReferences({
      collection: 'tags',
      id: doc.id,
    })
  }
  return doc
}
