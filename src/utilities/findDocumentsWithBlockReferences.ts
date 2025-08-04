import configPromise from '@payload-config'
import { getPayload } from 'payload'

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

  const blockMappings = {
    biographies: { blockType: 'biography', fieldName: 'biography' },
    teams: { blockType: 'team', fieldName: 'team' },
    media: { blockType: 'mediaBlock', fieldName: 'media' },
    forms: { blockType: 'formBlock', fieldName: 'form' },
  }

  const mapping = blockMappings[reference.collection]
  if (!mapping) {
    throw new Error(`Unknown reference collection: ${reference.collection}`)
  }

  try {
    const pagesWithBlocksRes = await payload.find({
      collection: 'pages',
      where: {
        and: [
          {
            _status: { equals: 'published' },
          },
          {
            [`layout.${mapping.fieldName}`]: { equals: reference.id },
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

  // Query posts - only handle MediaBlock in rich text content for now
  // Note: Posts currently only use Banner and MediaBlock in rich text
  if (reference.collection === 'media') {
    try {
      const postsWithBlocks = await payload.find({
        collection: 'posts',
        where: {
          and: [
            {
              _status: { equals: 'published' },
            },
            {
              'content.media': { equals: reference.id },
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

      results.push(
        ...postsWithBlocks.docs.map((doc) => ({
          collection: 'posts' as const,
          id: doc.id,
          slug: doc.slug,
          tenant: doc.tenant,
        })),
      )
    } catch (error) {
      payload.logger.warn(`Error querying posts for media reference ${reference.id}: ${error}`)
    }
  }

  return results
}
