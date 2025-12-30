import type { CollectionAfterChangeHook, CollectionAfterDeleteHook } from 'payload'

import type { Document } from '@/payload-types'
import { revalidateBlockReferences } from '@/utilities/revalidateBlockReferences'
import { revalidateRelationshipReferences } from '@/utilities/revalidateRelationshipReferences'

async function revalidate(docId: number) {
  await revalidateBlockReferences({
    collection: 'documents',
    id: docId,
  })
  await revalidateRelationshipReferences({
    collection: 'documents',
    id: docId,
  })
}

export const revalidateDocuments: CollectionAfterChangeHook<Document> = async ({
  doc,
  req: { context },
}) => {
  if (context.disableRevalidate) return

  await revalidate(doc.id)
}

export const revalidateDocumentsDelete: CollectionAfterDeleteHook<Document> = async ({
  doc,
  req: { context },
}) => {
  if (context.disableRevalidate) return

  await revalidate(doc.id)
}
