import type { CollectionAfterChangeHook, CollectionAfterDeleteHook } from 'payload'

import type { Media } from '@/payload-types'
import { revalidateBlockReferences } from '@/utilities/revalidateBlockReferences'
import { revalidateRelationshipReferences } from '@/utilities/revalidateRelationshipReferences'

async function revalidate(docId: number) {
  await revalidateBlockReferences({
    collection: 'media',
    id: docId,
  })
  await revalidateRelationshipReferences({
    collection: 'media',
    id: docId,
  })
}

export const revalidateMedia: CollectionAfterChangeHook<Media> = async ({
  doc,
  req: { context },
}) => {
  if (context.disableRevalidate) return

  await revalidate(doc.id)
}

export const revalidateMediaDelete: CollectionAfterDeleteHook<Media> = async ({
  doc,
  req: { context },
}) => {
  if (context.disableRevalidate) return

  await revalidate(doc.id)
}
