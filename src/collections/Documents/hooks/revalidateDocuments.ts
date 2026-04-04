import type { CollectionAfterChangeHook, CollectionAfterDeleteHook } from 'payload'

import type { Document } from '@/payload-types'
import { compareRevalidationSystems } from '@/utilities/compareRevalidationSystems'
import { revalidateBlockReferences } from '@/utilities/revalidateBlockReferences'
import { revalidateRelationshipReferences } from '@/utilities/revalidateRelationshipReferences'

async function revalidate(docId: number) {
  const reference = { collection: 'documents' as const, id: docId }
  await revalidateBlockReferences(reference)
  await revalidateRelationshipReferences(reference)
  await compareRevalidationSystems(reference)
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
