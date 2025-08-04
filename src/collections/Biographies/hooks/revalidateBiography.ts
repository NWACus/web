import configPromise from '@payload-config'
import type { CollectionAfterChangeHook, CollectionAfterDeleteHook } from 'payload'
import { getPayload } from 'payload'

import type { Biography } from '@/payload-types'
import {
  revalidateBlockReferences,
  revalidateDocument,
} from '@/utilities/revalidateBlockReferences'

async function revalidateBiographyWithCascading(biographyId: number) {
  const payload = await getPayload({ config: configPromise })

  await revalidateBlockReferences({
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

  try {
    // Also revalidate posts with this biography as an author
    payload.logger.info(`Checking for post author references for biography ID ${biographyId}`)

    const postsWithAuthorRes = await payload.find({
      collection: 'posts',
      where: {
        and: [
          {
            _status: { equals: 'published' },
          },
          {
            authors: { equals: biographyId },
          },
        ],
      },
      select: {
        id: true,
        slug: true,
        tenant: true,
      },
      depth: 1,
    })

    const postWithAuthor = postsWithAuthorRes.docs.map((doc) => ({
      collection: 'posts' as const,
      id: doc.id,
      slug: doc.slug,
      tenant: doc.tenant,
    }))

    payload.logger.info(
      `Found ${postWithAuthor.length} posts documents referencing biography ID ${biographyId} as author`,
    )

    for (const doc of postWithAuthor) {
      await revalidateDocument(doc)
    }

    payload.logger.info(
      `Completed revalidation of posts where biography ID ${biographyId} is an author`,
    )
  } catch (error) {
    payload.logger.warn(
      `Error querying posts for biography author reference ${biographyId}: ${error}`,
    )
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
