import type { CollectionAfterChangeHook, CollectionAfterDeleteHook } from 'payload'

import { revalidateBlockReferences } from '@/utilities/revalidateBlockReferences'

export const revalidateForm: CollectionAfterChangeHook = async ({ doc, req: { context } }) => {
  if (!context.disableRevalidate) {
    await revalidateBlockReferences({
      collection: 'forms',
      id: doc.id,
    })
  }
  return doc
}

export const revalidateFormDelete: CollectionAfterDeleteHook = async ({
  doc,
  req: { context },
}) => {
  if (!context.disableRevalidate) {
    await revalidateBlockReferences({
      collection: 'forms',
      id: doc.id,
    })
  }
  return doc
}
