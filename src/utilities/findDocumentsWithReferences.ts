import configPromise from '@payload-config'
import type { CollectionSlug, Where } from 'payload'
import { getPayload } from 'payload'
import { isTenantValue } from './isTenantValue'
import { DocumentForRevalidation } from './revalidateDocument'

export interface ReferenceQuery {
  collection: string
  id: number
}

function isCollectionSlug(slug: string, allSlugs: Set<string>): slug is CollectionSlug {
  return allSlugs.has(slug)
}

/** Find all documents whose `documentReferences` field contains a reference to the given document. */
export async function findDocumentsWithReferences(
  reference: ReferenceQuery,
): Promise<DocumentForRevalidation[]> {
  const payload = await getPayload({ config: configPromise })

  const allSlugs = new Set(payload.config.collections.map((c) => c.slug))

  const collectionsWithReferences = payload.config.collections
    .filter((c) => c.fields.some((f) => 'name' in f && f.name === 'documentReferences'))
    .map((c) => ({ slug: c.slug, hasDrafts: Boolean(c.versions && c.versions.drafts) }))

  const settled = await Promise.allSettled(
    collectionsWithReferences.map(async ({ slug: collectionSlug, hasDrafts }) => {
      if (!isCollectionSlug(collectionSlug, allSlugs)) return []

      // Only filter by _status for collections with drafts enabled
      const conditions: Where[] = hasDrafts ? [{ _status: { equals: 'published' } }] : []
      conditions.push(
        { 'documentReferences.collection': { equals: reference.collection } },
        { 'documentReferences.docId': { equals: reference.id } },
      )
      const where: Where = { and: conditions }

      const res = await payload.find({
        collection: collectionSlug,
        where,
        select: { id: true, slug: true, tenant: true },
        depth: 1,
        limit: 0,
      })

      return res.docs.flatMap((doc) => {
        // Payload's generated types don't have index signatures
        const record: Record<string, unknown> = { ...doc }
        const tenant = record['tenant']
        if (!isTenantValue(tenant)) return []

        return [
          {
            collection: collectionSlug,
            id: doc.id,
            slug: typeof record['slug'] === 'string' ? record['slug'] : '',
            tenant,
          },
        ]
      })
    }),
  )

  const results: DocumentForRevalidation[] = []
  for (const [i, result] of settled.entries()) {
    if (result.status === 'fulfilled') {
      results.push(...result.value)
    } else {
      const message = result.reason instanceof Error ? result.reason.message : String(result.reason)
      payload.logger.warn(
        `Error querying ${collectionsWithReferences[i].slug} for ${reference.collection} reference ${reference.id}: ${message}`,
      )
    }
  }

  return results
}
