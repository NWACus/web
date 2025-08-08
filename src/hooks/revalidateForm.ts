import type { CollectionAfterChangeHook, CollectionAfterDeleteHook } from 'payload'

import { revalidateBlockReferences } from '@/utilities/revalidateBlockReferences'
import { revalidateRelationshipReferences } from '@/utilities/revalidateRelationshipReferences'

async function revalidate(docId: number) {
  await revalidateBlockReferences({
    collection: 'forms',
    id: docId,
  })
  await revalidateRelationshipReferences({
    collection: 'forms',
    id: docId,
  })
}

export const revalidateForm: CollectionAfterChangeHook = async ({ doc, req: { context } }) => {
  if (context.disableRevalidate) return

  await revalidate(doc.id)
}

export const revalidateFormDelete: CollectionAfterDeleteHook = async ({
  doc,
  req: { context },
}) => {
  if (context.disableRevalidate) return

  await revalidate(doc.id)
}
