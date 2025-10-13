import type { CollectionAfterChangeHook, CollectionAfterDeleteHook } from 'payload'

import type { Sponsor } from '@/payload-types'
import { revalidateBlockReferences } from '@/utilities/revalidateBlockReferences'
import { revalidateRelationshipReferences } from '@/utilities/revalidateRelationshipReferences'

async function revalidate(docId: number) {
  await revalidateBlockReferences({
    collection: 'sponsors',
    id: docId,
  })
  await revalidateRelationshipReferences({
    collection: 'sponsors',
    id: docId,
  })
}

export const revalidateSponsors: CollectionAfterChangeHook<Sponsor> = async ({
  doc,
  req: { context },
}) => {
  if (context.disableRevalidate) return

  await revalidate(doc.id)
}

export const revalidateSponsorsDelete: CollectionAfterDeleteHook<Sponsor> = async ({
  doc,
  req: { context },
}) => {
  if (context.disableRevalidate) return

  await revalidate(doc.id)
}
