import type { CollectionAfterChangeHook, CollectionAfterDeleteHook } from 'payload'

import type { Team } from '@/payload-types'
import { compareRevalidationSystems } from '@/utilities/compareRevalidationSystems'
import { revalidateBlockReferences } from '@/utilities/revalidateBlockReferences'
import { revalidateRelationshipReferences } from '@/utilities/revalidateRelationshipReferences'

async function revalidate(docId: number) {
  const reference = { collection: 'teams' as const, id: docId }
  await revalidateBlockReferences(reference)
  await revalidateRelationshipReferences(reference)
  await compareRevalidationSystems(reference)
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
