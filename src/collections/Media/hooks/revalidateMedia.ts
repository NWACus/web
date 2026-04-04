import type { CollectionAfterChangeHook, CollectionAfterDeleteHook } from 'payload'

import type { Media } from '@/payload-types'
import { compareRevalidationSystems } from '@/utilities/compareRevalidationSystems'
import { revalidateBlockReferences } from '@/utilities/revalidateBlockReferences'
import { revalidateRelationshipReferences } from '@/utilities/revalidateRelationshipReferences'

async function revalidate(docId: number) {
  const reference = { collection: 'media' as const, id: docId }
  await revalidateBlockReferences(reference)
  await revalidateRelationshipReferences(reference)
  await compareRevalidationSystems(reference)
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
