import configPromise from '@payload-config'
import type { CollectionSlug } from 'payload'
import { getPayload } from 'payload'
import { isTenantValue } from './isTenantValue'
import { DocumentForRevalidation } from './revalidateDocument'

export interface ReferenceQuery {
  collection: string
  id: number
}

// SanitizedCollectionConfig.slug is string but payload.find() requires CollectionSlug
function isCollectionSlug(slug: string, validSlugs: Set<string>): slug is CollectionSlug {
  return validSlugs.has(slug)
}

/** Find all documents whose `documentReferences` field contains a reference to the given document. */
export async function findDocumentsWithReferences(
  reference: ReferenceQuery,
): Promise<DocumentForRevalidation[]> {
  const payload = await getPayload({ config: configPromise })
  const results: DocumentForRevalidation[] = []

  const allSlugs = new Set(payload.config.collections.map((c) => c.slug))

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
        limit: 0,
      })

      for (const doc of res.docs) {
        // Payload's generated types don't have index signatures
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
