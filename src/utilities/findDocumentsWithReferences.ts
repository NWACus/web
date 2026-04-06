import configPromise from '@payload-config'
import type { CollectionSlug } from 'payload'
import { getPayload } from 'payload'
import { isTenantValue } from './isTenantValue'
import { DocumentForRevalidation } from './revalidateDocument'

export interface DocumentReference {
  collection: string
  id: number
}

/**
 * Type guard: validates that a string is a registered Payload collection slug.
 * Needed because SanitizedCollectionConfig.slug is typed as string, but payload.find()
 * requires the narrower CollectionSlug union type.
 */
function isCollectionSlug(slug: string, validSlugs: Set<string>): slug is CollectionSlug {
  return validSlugs.has(slug)
}

/**
 * Find all documents that have a `documentReferences` field and contain references to
 * a specific document.
 *
 * Discovers which collections to query by inspecting the Payload config at runtime,
 * rather than hardcoding collection slugs.
 *
 * Replaces both `findDocumentsWithBlockReferences` and `findDocumentsWithRelationshipReferences`
 * by querying a single denormalized field instead of config-driven mappings.
 */
export async function findDocumentsWithReferences(
  reference: DocumentReference,
): Promise<DocumentForRevalidation[]> {
  const payload = await getPayload({ config: configPromise })
  const results: DocumentForRevalidation[] = []

  const allSlugs = new Set(payload.config.collections.map((c) => c.slug))

  // Discover collections that have a top-level documentReferences field
  const collectionsWithReferences = payload.config.collections
    .filter((c) => c.fields.some((f) => 'name' in f && f.name === 'documentReferences'))
    .map((c) => c.slug)

  for (const collectionSlug of collectionsWithReferences) {
    if (!isCollectionSlug(collectionSlug, allSlugs)) continue

    try {
      const res = await payload.find({
        collection: collectionSlug,
        where: {
          and: [
            { _status: { equals: 'published' } },
            { 'documentReferences.collection': { equals: reference.collection } },
            { 'documentReferences.docId': { equals: reference.id } },
          ],
        },
        depth: 1,
      })

      for (const doc of res.docs) {
        // Spread into a plain object for generic property access, since Payload's
        // generated types don't have index signatures
        const record: Record<string, unknown> = { ...doc }

        const tenant = record['tenant']
        if (!isTenantValue(tenant)) continue

        results.push({
          collection: collectionSlug,
          id: doc.id,
          slug: typeof record['slug'] === 'string' ? record['slug'] : '',
          tenant,
        })
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      payload.logger.warn(
        `Error querying ${collectionSlug} for ${reference.collection} reference ${reference.id}: ${message}`,
      )
    }
  }

  return results
}
