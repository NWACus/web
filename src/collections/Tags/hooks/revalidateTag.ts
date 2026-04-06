import type { CollectionAfterChangeHook, CollectionAfterDeleteHook } from 'payload'

import type { Tag } from '@/payload-types'
import { revalidateDocumentReferences } from '@/utilities/revalidateDocumentReferences'

async function revalidate(docId: number) {
  await revalidateDocumentReferences({ collection: 'tags', id: docId })
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
