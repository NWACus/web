import type { CollectionAfterChangeHook, CollectionAfterDeleteHook } from 'payload'

import type { Sponsor } from '@/payload-types'
import { revalidateDocumentReferences } from '@/utilities/revalidateDocumentReferences'

async function revalidate(docId: number) {
  await revalidateDocumentReferences({ collection: 'sponsors', id: docId })
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
