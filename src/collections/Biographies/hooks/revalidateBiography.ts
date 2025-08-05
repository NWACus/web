import configPromise from '@payload-config'
import type { CollectionAfterChangeHook, CollectionAfterDeleteHook } from 'payload'
import { getPayload } from 'payload'

import type { Biography } from '@/payload-types'
import { revalidateBlockReferences } from '@/utilities/revalidateBlockReferences'
import { revalidateRelationshipReferences } from '@/utilities/revalidateRelationshipReferences'

async function revalidateBiographyWithCascading(biographyId: number) {
  const payload = await getPayload({ config: configPromise })

  await revalidateBlockReferences({
    collection: 'biographies',
    id: biographyId,
  })

  await revalidateRelationshipReferences({
    collection: 'biographies',
    id: biographyId,
  })

  try {
    // Also revalidate teams that contain this biography (i.e. pages/posts with TeamBlocks)
    payload.logger.info(`Checking for cascading team references for biography ID ${biographyId}`)

    const teamsWithBiographyRes = await payload.find({
      collection: 'teams',
      where: {
        members: { equals: biographyId },
      },
      depth: 0,
    })

    const teamsWithBiography = teamsWithBiographyRes.docs.map((team) => ({
      collection: 'teams',
      id: team.id,
    }))

    if (teamsWithBiography.length > 0) {
      payload.logger.info(
        `Found ${teamsWithBiography.length} teams containing biography ID ${biographyId}`,
      )

      for (const teamReference of teamsWithBiography) {
        await revalidateBlockReferences({
          collection: 'teams',
          id: teamReference.id,
        })
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
  if (!context.disableRevalidate) {
    await revalidateBiographyWithCascading(doc.id)
  }
  return doc
}

export const revalidateDelete: CollectionAfterDeleteHook<Biography> = async ({
  doc,
  req: { context },
}) => {
  if (!context.disableRevalidate) {
    await revalidateBiographyWithCascading(doc.id)
  }
  return doc
}
