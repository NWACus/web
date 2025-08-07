import type { CollectionAfterChangeHook, CollectionAfterDeleteHook } from 'payload'

import type { Tag } from '@/payload-types'
import { revalidateBlockReferences } from '@/utilities/revalidateBlockReferences'
import { revalidateRelationshipReferences } from '@/utilities/revalidateRelationshipReferences'

async function revalidate(docId: number) {
  await revalidateBlockReferences({
    collection: 'tags',
    id: docId,
  })
  await revalidateRelationshipReferences({
    collection: 'tags',
    id: docId,
  })
}

export const revalidateTag: CollectionAfterChangeHook<Tag> = async ({ doc, req: { context } }) => {
  if (context.disableRevalidate) return

  await revalidate(doc.id)
}

export const revalidateDelete: CollectionAfterDeleteHook<Tag> = async ({
  doc,
  req: { context },
}) => {
  if (context.disableRevalidate) return

  await revalidate(doc.id)
}
