import type { CollectionAfterChangeHook, CollectionAfterDeleteHook } from 'payload'

import { revalidateDocumentReferences } from '@/utilities/revalidateDocumentReferences'

async function revalidate(docId: number) {
  await revalidateDocumentReferences({ collection: 'forms', id: docId })
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
