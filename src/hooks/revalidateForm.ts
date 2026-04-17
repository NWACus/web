import type { CollectionAfterChangeHook, CollectionAfterDeleteHook } from 'payload'

import { revalidateBlockReferences } from '@/utilities/revalidateBlockReferences'
import { revalidateRelationshipReferences } from '@/utilities/revalidateRelationshipReferences'

async function revalidate(docId: number) {
  const reference = { collection: 'forms' as const, id: docId }
  await revalidateBlockReferences(reference)
  await revalidateRelationshipReferences(reference)
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
