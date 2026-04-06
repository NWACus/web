import configPromise from '@payload-config'
import type { CollectionAfterChangeHook, CollectionAfterDeleteHook } from 'payload'
import { getPayload } from 'payload'

import type { Biography } from '@/payload-types'
import { revalidateDocumentReferences } from '@/utilities/revalidateDocumentReferences'

async function revalidateBiographyWithCascading(biographyId: number) {
  const payload = await getPayload({ config: configPromise })

  await revalidateDocumentReferences({ collection: 'biographies', id: biographyId })

  try {
    // Also revalidate documents referencing teams that contain this biography
    payload.logger.info(`Checking for cascading team references for biography ID ${biographyId}`)

    const teamsWithBiographyRes = await payload.find({
      collection: 'teams',
      where: {
        members: { equals: biographyId },
      },
      depth: 0,
    })

    if (teamsWithBiographyRes.docs.length > 0) {
      payload.logger.info(
        `Found ${teamsWithBiographyRes.docs.length} teams containing biography ID ${biographyId}`,
      )

      for (const team of teamsWithBiographyRes.docs) {
        await revalidateDocumentReferences({ collection: 'teams', id: team.id })
      }
    } else {
      payload.logger.info(`No teams found containing biography ID ${biographyId}`)
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
