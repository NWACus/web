import type { CollectionAfterChangeHook, CollectionAfterDeleteHook } from 'payload'

import type { Team } from '@/payload-types'
import { revalidateDocumentReferences } from '@/utilities/revalidateDocumentReferences'

async function revalidate(docId: number) {
  await revalidateDocumentReferences({ collection: 'teams', id: docId })
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
