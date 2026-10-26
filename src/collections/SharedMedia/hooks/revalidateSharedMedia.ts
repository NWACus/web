import type { CollectionAfterChangeHook, CollectionAfterDeleteHook } from 'payload'

import type { SharedMedia } from '@/payload-types'
import { revalidateDocumentReferences } from '@/utilities/revalidateDocumentReferences'

async function revalidate(docId: number) {
  await revalidateDocumentReferences({ collection: 'sharedMedia', id: docId })
}

export const revalidateSharedMedia: CollectionAfterChangeHook<SharedMedia> = async ({
  doc,
  req: { context },
}) => {
  if (context.disableRevalidate) return

  await revalidate(doc.id)
}

export const revalidateSharedMediaDelete: CollectionAfterDeleteHook<SharedMedia> = async ({
  doc,
  req: { context },
}) => {
  if (context.disableRevalidate) return

  await revalidate(doc.id)
}
