import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { isTenantValue } from './isTenantValue'
import { DocumentForRevalidation, ROUTABLE_COLLECTIONS } from './revalidateDocument'

export interface ReferenceQuery {
  collection: string
  id: number
}

/** Find all documents whose `documentReferences` field contains a reference to the given document. */
export async function findDocumentsWithReferences(
  reference: ReferenceQuery,
): Promise<DocumentForRevalidation[]> {
  const payload = await getPayload({ config: configPromise })
  const settled = await Promise.allSettled(
    ROUTABLE_COLLECTIONS.map(async (collectionSlug) => {
      const res = await payload.find({
        collection: collectionSlug,
        where: {
          and: [
            { _status: { equals: 'published' } },
            { 'documentReferences.collection': { equals: reference.collection } },
            { 'documentReferences.docId': { equals: reference.id } },
          ],
        },
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
        `Error querying ${ROUTABLE_COLLECTIONS[i]} for ${reference.collection} reference ${reference.id}: ${message}`,
      )
    }
  }

  return results
}
