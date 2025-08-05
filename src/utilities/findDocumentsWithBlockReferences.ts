import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { getBlocksFromConfig } from './getBlocksFromConfig'

export interface BlockReference {
  collection: 'biographies' | 'teams' | 'media' | 'forms'
  id: number
}

export interface DocumentWithBlockReference {
  collection: 'pages' | 'posts'
  id: number
  slug: string
  tenant: number | { id: number; slug: string }
}

/**
 * Find all pages and posts that contain blocks referencing a specific document
 * This is used for revalidation when reference collections (biographies, teams, media, forms) change
 */
export async function findDocumentsWithBlockReferences(
  reference: BlockReference,
): Promise<DocumentWithBlockReference[]> {
  const payload = await getPayload({ config: configPromise })
  const results: DocumentWithBlockReference[] = []

  const { pagesBlockMappings, postsBlockMappings } = await getBlocksFromConfig()

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

      const pagesWithBlocks: DocumentWithBlockReference[] = pagesWithBlocksRes.docs.map((doc) => ({
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

      const postsWithBlocks: DocumentWithBlockReference[] = postsWithBlocksRes.docs.map((doc) => ({
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

  return results
}
