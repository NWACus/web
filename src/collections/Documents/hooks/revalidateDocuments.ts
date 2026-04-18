import type { CollectionAfterChangeHook, CollectionAfterDeleteHook } from 'payload'

import type { Document } from '@/payload-types'
import { revalidateDocumentReferences } from '@/utilities/revalidateDocumentReferences'

async function revalidate(docId: number) {
  await revalidateDocumentReferences({ collection: 'documents', id: docId })
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
