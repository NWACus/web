import type { CollectionAfterChangeHook, CollectionAfterDeleteHook } from 'payload'

import type { Biography } from '@/payload-types'
import { revalidateDocumentReferences } from '@/utilities/revalidateDocumentReferences'

async function revalidate(docId: number) {
  await revalidateDocumentReferences({ collection: 'biographies', id: docId })
}

export const revalidateBiography: CollectionAfterChangeHook<Biography> = async ({
  doc,
  req: { context },
}) => {
  if (context.disableRevalidate) return

  await revalidate(doc.id)
}

export const revalidateBiographyDelete: CollectionAfterDeleteHook<Biography> = async ({
  doc,
  req: { context },
}) => {
  if (context.disableRevalidate) return

  await revalidate(doc.id)
}
