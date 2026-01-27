import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { getBlocksFromConfig } from './getBlocksFromConfig'
import { DocumentForRevalidation, RevalidationReference } from './revalidateDocument'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function hasId(value: unknown): value is { id: unknown } {
  return typeof value === 'object' && value !== null && 'id' in value
}

/**
 * Recursively search for matching references in a block's data structure
 */
function hasMatchingReference(
  obj: unknown,
  fieldName: string,
  referenceId: string | number,
): boolean {
  if (!isRecord(obj)) return false

  if (fieldName in obj) {
    const fieldValue = obj[fieldName]

    if (Array.isArray(fieldValue)) {
      if (fieldValue.includes(referenceId)) {
        return true
      }
      for (const item of fieldValue) {
        if (hasId(item) && item.id === referenceId) {
          return true
        }
      }
    }

    if (hasId(fieldValue) && fieldValue.id === referenceId) {
      return true
    }

    if (fieldValue === referenceId) {
      return true
    }
  }

  for (const value of Object.values(obj)) {
    if (Array.isArray(value)) {
      for (const item of value) {
        if (hasMatchingReference(item, fieldName, referenceId)) {
          return true
        }
      }
    } else if (isRecord(value)) {
      if (hasMatchingReference(value, fieldName, referenceId)) {
        return true
      }
    }
  }

  return false
}

/**
 * Find all pages, posts, and homePages that contain blocks referencing a specific document
 * This is used for revalidation when reference collections (biographies, teams, media, forms) change
 */
export async function findDocumentsWithBlockReferences(
  reference: RevalidationReference,
): Promise<DocumentForRevalidation[]> {
  const payload = await getPayload({ config: configPromise })
  const results: DocumentForRevalidation[] = []

  const {
    pagesBlockMappings,
    postsBlockMappings,
    homePagesBlockMappings,
    homePagesHighlightedContentBlockMappings,
    eventsBlockMappings,
  } = await getBlocksFromConfig()

  const pagesMappings = pagesBlockMappings[reference.collection]

  if (pagesMappings) {
    for (const mapping of pagesMappings) {
      try {
        if (mapping.isHasMany) {
          // We can't query nested arrays with the Payload Local API so we need to find all
          // pages with this blockType and then filter the results using custom logic
          const pagesRes = await payload.find({
            collection: 'pages',
            where: {
              and: [
                {
                  _status: { equals: 'published' },
                },
                {
                  'layout.blockType': { equals: mapping.blockType },
                },
              ],
            },
            depth: 1,
          })

          const pagesWithMatchingBlocks = pagesRes.docs.filter(({ layout }) => {
            const matchingBlocks = layout.find((block) => {
              if (block.blockType === mapping.blockType) {
                return hasMatchingReference(block, mapping.fieldName, reference.id)
              }
              return false
            })

            return !!matchingBlocks
          })

          const pagesWithBlocks: DocumentForRevalidation[] = pagesWithMatchingBlocks.map((doc) => ({
            collection: 'pages',
            id: doc.id,
            slug: doc.slug,
            tenant: doc.tenant,
          }))

          results.push(...pagesWithBlocks)
        } else {
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
            depth: 1,
          })

          const pagesWithBlocks: DocumentForRevalidation[] = pagesWithBlocksRes.docs.map((doc) => ({
            collection: 'pages',
            id: doc.id,
            slug: doc.slug,
            tenant: doc.tenant,
          }))

          results.push(...pagesWithBlocks)
        }
      } catch (error) {
        payload.logger.warn(
          `Error querying pages for ${reference.collection} reference ${reference.id} in field ${mapping.fieldName}: ${error}`,
        )
      }
    }
  }

  const postsMappings = postsBlockMappings[reference.collection]

  if (postsMappings) {
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
              'blocksInContent.docId': { equals: reference.id },
            },
          ],
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
    for (const mapping of homePagesMapping) {
      try {
        if (mapping.isHasMany) {
          // We can't query nested arrays with the Payload Local API so we need to find all
          // pages with this blockType and then filter the results using custom logic
          const homePagesRes = await payload.find({
            collection: 'homePages',
            where: {
              and: [
                {
                  _status: { equals: 'published' },
                },
                {
                  'layout.blockType': { equals: mapping.blockType },
                },
              ],
            },
            depth: 1,
          })

          const pagesWithMatchingBlocks = homePagesRes.docs.filter(({ layout }) => {
            const matchingBlocks = layout.find((block) => {
              if (block.blockType === mapping.blockType) {
                return hasMatchingReference(block, mapping.fieldName, reference.id)
              }
              return false
            })

            return !!matchingBlocks
          })

          const pagesWithBlocks: DocumentForRevalidation[] = pagesWithMatchingBlocks.map((doc) => ({
            collection: 'homePages',
            id: doc.id,
            slug: '',
            tenant: doc.tenant,
          }))

          results.push(...pagesWithBlocks)
        } else {
          const homePagesWithBlocksRes = await payload.find({
            collection: 'homePages',
            where: {
              [`layout.${mapping.fieldName}`]: { equals: reference.id },
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
        }
      } catch (error) {
        payload.logger.warn(
          `Error querying homePages for ${reference.collection} reference ${reference.id}: ${error}`,
        )
      }
    }
  }

  // Query homePages.blocksInHighlightedContent for references in highlightedContent richText fields
  const homePagesHighlightedContentMappings =
    homePagesHighlightedContentBlockMappings[reference.collection]

  if (homePagesHighlightedContentMappings) {
    try {
      const homePagesWithBlocksRes = await payload.find({
        collection: 'homePages',
        where: {
          and: [
            {
              'blocksInHighlightedContent.collection': { equals: reference.collection },
            },
            {
              'blocksInHighlightedContent.docId': { equals: reference.id },
            },
          ],
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
        `Error querying homePages.blocksInHighlightedContent for ${reference.collection} reference ${reference.id}: ${error}`,
      )
    }
  }

  const eventsMappings = eventsBlockMappings[reference.collection]

  if (eventsMappings) {
    try {
      const eventsWithBlocksRes = await payload.find({
        collection: 'events',
        where: {
          and: [
            {
              _status: { equals: 'published' },
            },
            {
              'blocksInContent.collection': { equals: reference.collection },
            },
            {
              'blocksInContent.docId': { equals: reference.id },
            },
          ],
        },
        depth: 1,
      })

      const eventsWithBlocks: DocumentForRevalidation[] = eventsWithBlocksRes.docs.map((doc) => ({
        collection: 'events',
        id: doc.id,
        slug: doc.slug,
        tenant: doc.tenant,
      }))

      results.push(...eventsWithBlocks)
    } catch (error) {
      payload.logger.warn(
        `Error querying events for ${reference.collection} reference ${reference.id}: ${error}`,
      )
    }
  }

  return results
}
