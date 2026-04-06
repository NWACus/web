import type { CollectionAfterChangeHook, CollectionAfterDeleteHook } from 'payload'

import type { Tag } from '@/payload-types'
import { revalidateBlockReferences } from '@/utilities/revalidateBlockReferences'
import { revalidateRelationshipReferences } from '@/utilities/revalidateRelationshipReferences'

async function revalidate(docId: number) {
  const reference = { collection: 'tags' as const, id: docId }
  await revalidateBlockReferences(reference)
  await revalidateRelationshipReferences(reference)
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
