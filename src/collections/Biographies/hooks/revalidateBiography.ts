import configPromise from '@payload-config'
import type { CollectionAfterChangeHook, CollectionAfterDeleteHook } from 'payload'
import { getPayload } from 'payload'

import type { Biography } from '@/payload-types'
import { revalidateDocumentReferences } from '@/utilities/revalidateDocumentReferences'

async function revalidateBiographyWithCascading(biographyId: number) {
  const payload = await getPayload({ config: configPromise })

  await revalidateDocumentReferences({ collection: 'biographies', id: biographyId })

  try {
    const teamsWithBiographyRes = await payload.find({
      collection: 'teams',
      where: {
        members: { contains: biographyId },
      },
      depth: 0,
    })

    for (const team of teamsWithBiographyRes.docs) {
      await revalidateDocumentReferences({ collection: 'teams', id: team.id })
    }
  } catch (error) {
    payload.logger.warn(`Error finding teams with biography member ${biographyId}: ${error}`)
  }
}

export const revalidateBiography: CollectionAfterChangeHook<Biography> = async ({
  doc,
  req: { context },
}) => {
  if (context.disableRevalidate) return

  await revalidateBiographyWithCascading(doc.id)
}

export const revalidateBiographyDelete: CollectionAfterDeleteHook<Biography> = async ({
  doc,
  req: { context },
}) => {
  if (context.disableRevalidate) return

  await revalidateBiographyWithCascading(doc.id)
}
