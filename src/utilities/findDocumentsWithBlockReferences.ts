import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { getBlocksFromConfig } from './getBlocksFromConfig'
import { DocumentForRevalidation, RevalidationReference } from './revalidateDocument'

/**
 * Find all pages, posts, and homePages that contain blocks referencing a specific document
 * This is used for revalidation when reference collections (biographies, teams, media, forms) change
 */
export async function findDocumentsWithBlockReferences(
  reference: RevalidationReference,
): Promise<DocumentForRevalidation[]> {
  const payload = await getPayload({ config: configPromise })
  const results: DocumentForRevalidation[] = []

  const { pagesBlockMappings, postsBlockMappings, homePagesBlockMappings } =
    await getBlocksFromConfig()

  const pagesMapping = pagesBlockMappings[reference.collection]

  if (pagesMapping) {
    try {
      const pagesWithBlocksRes = await payload.find({
        collection: 'pages',
        where: {
          and: [
            {
              _status: { equals: 'published' },
            },
            {
              [`layout.${pagesMapping.fieldName}`]: { equals: reference.id },
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

      const pagesWithBlocks: DocumentForRevalidation[] = pagesWithBlocksRes.docs.map((doc) => ({
        collection: 'pages',
        id: doc.id,
        slug: doc.slug,
        tenant: doc.tenant,
      }))

      results.push(...pagesWithBlocks)
    } catch (error) {
      payload.logger.warn(
        `Error querying pages for ${reference.collection} reference ${reference.id}: ${error}`,
      )
    }
  }

  const postsMapping = postsBlockMappings[reference.collection]

  if (postsMapping) {
    try {
      const postsWithBlocksRes = await payload.find({
        collection: 'posts',
        where: {
          and: [
            {
              _status: { equals: 'published' },
            },
            {
              'blocksInContent.collection': { equals: reference.collection },
            },
            {
              'blocksInContent.blockId': { equals: reference.id },
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

      const postsWithBlocks: DocumentForRevalidation[] = postsWithBlocksRes.docs.map((doc) => ({
        collection: 'posts',
        id: doc.id,
        slug: doc.slug,
        tenant: doc.tenant,
      }))

      results.push(...postsWithBlocks)
    } catch (error) {
      payload.logger.warn(
        `Error querying posts for ${reference.collection} reference ${reference.id}: ${error}`,
      )
    }
  }

  const homePagesMapping = homePagesBlockMappings[reference.collection]

  if (homePagesMapping) {
    try {
      const homePagesWithBlocksRes = await payload.find({
        collection: 'homePages',
        where: {
          [`layout.${homePagesMapping.fieldName}`]: { equals: reference.id },
        },
        select: {
          id: true,
          tenant: true,
        },
        depth: 1,
      })

      const homePagesWithBlocks: DocumentForRevalidation[] = homePagesWithBlocksRes.docs.map(
        (doc) => ({
          collection: 'homePages',
          id: doc.id,
          slug: '',
          tenant: doc.tenant,
        }),
      )

      results.push(...homePagesWithBlocks)
    } catch (error) {
      payload.logger.warn(
        `Error querying homePages for ${reference.collection} reference ${reference.id}: ${error}`,
      )
    }
  }

  return results
}
