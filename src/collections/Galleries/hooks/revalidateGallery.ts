import type { CollectionAfterChangeHook, CollectionAfterDeleteHook } from 'payload'

import type { Gallery } from '@/payload-types'
import { revalidateDocumentReferences } from '@/utilities/revalidateDocumentReferences'

async function revalidate(docId: number) {
  await revalidateDocumentReferences({ collection: 'galleries', id: docId })
}

export const revalidateGallery: CollectionAfterChangeHook<Gallery> = async ({
  doc,
  req: { context },
}) => {
  if (context.disableRevalidate) return

  await revalidate(doc.id)
}

export const revalidateGalleryDelete: CollectionAfterDeleteHook<Gallery> = async ({
  doc,
  req: { context },
}) => {
  if (context.disableRevalidate) return

  await revalidate(doc.id)
}
