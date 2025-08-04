import type { CollectionAfterChangeHook, CollectionAfterDeleteHook } from 'payload'

import type { Team } from '@/payload-types'
import { revalidateBlockReferences } from '@/utilities/revalidateBlockReferences'

export const revalidateTeam: CollectionAfterChangeHook<Team> = async ({
  doc,
  req: { context },
}) => {
  if (!context.disableRevalidate) {
    await revalidateBlockReferences({
      collection: 'teams',
      id: doc.id,
    })
  }
  return doc
}

export const revalidateDelete: CollectionAfterDeleteHook<Team> = async ({
  doc,
  req: { context },
}) => {
  if (!context.disableRevalidate) {
    await revalidateBlockReferences({
      collection: 'teams',
      id: doc.id,
    })
  }
  return doc
}
