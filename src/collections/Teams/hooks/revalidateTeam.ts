import type { CollectionAfterChangeHook, CollectionAfterDeleteHook } from 'payload'

import type { Team } from '@/payload-types'
import { revalidateBlockReferences } from '@/utilities/revalidateBlockReferences'
import { revalidateRelationshipReferences } from '@/utilities/revalidateRelationshipReferences'

async function revalidate(docId: number) {
  await revalidateBlockReferences({
    collection: 'teams',
    id: docId,
  })
  await revalidateRelationshipReferences({
    collection: 'teams',
    id: docId,
  })
}

export const revalidateTeam: CollectionAfterChangeHook<Team> = async ({
  doc,
  req: { context },
}) => {
  if (context.disableRevalidate) return

  await revalidate(doc.id)
}

export const revalidateTeamDelete: CollectionAfterDeleteHook<Team> = async ({
  doc,
  req: { context },
}) => {
  if (context.disableRevalidate) return

  await revalidate(doc.id)
}
