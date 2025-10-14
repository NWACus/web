import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { getBlocksFromConfig } from './getBlocksFromConfig'
import { DocumentForRevalidation, RevalidationReference } from './revalidateDocument'

/**
 * Recursively search for matching references in a block's data structure
 */
function hasMatchingReference(
  obj: unknown,
  fieldName: string,
  referenceId: string | number,
): boolean {
  if (!obj || typeof obj !== 'object') return false

  const record = obj as Record<string, unknown>

  // Check if this object has the field we're looking for
  if (fieldName in record) {
    const fieldValue = record[fieldName]

    // Handle arrays
    if (Array.isArray(fieldValue)) {
      // Array of primitive values (IDs)
      if (fieldValue.includes(referenceId)) {
        return true
      }
      // Array of objects with id property
      for (const item of fieldValue) {
        if (typeof item === 'object' && item && 'id' in item) {
          if ((item as { id: unknown }).id === referenceId) {
            return true
          }
        }
      }
    }

    // Handle case where field value is an object with id
    if (typeof fieldValue === 'object' && fieldValue && 'id' in fieldValue) {
      return (fieldValue as { id: unknown }).id === referenceId
    }

    // Handle direct id comparison
    if (fieldValue === referenceId) {
      return true
    }
  }

  // Recursively search through arrays and nested objects
  for (const value of Object.values(record)) {
    if (Array.isArray(value)) {
      for (const item of value) {
        if (hasMatchingReference(item, fieldName, referenceId)) {
          return true
        }
      }
    } else if (value && typeof value === 'object') {
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

  const { pagesBlockMappings, postsBlockMappings, homePagesBlockMappings } =
    await getBlocksFromConfig()

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

  return results
}
