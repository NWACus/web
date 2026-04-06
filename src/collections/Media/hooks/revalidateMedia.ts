import type { CollectionAfterChangeHook, CollectionAfterDeleteHook } from 'payload'

import type { Media } from '@/payload-types'
import { revalidateDocumentReferences } from '@/utilities/revalidateDocumentReferences'

async function revalidate(docId: number) {
  await revalidateDocumentReferences({ collection: 'media', id: docId })
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
