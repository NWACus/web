import configPromise from '@payload-config'
import { getPayload } from 'payload'

import { findDocumentsWithBlockReferences } from './findDocumentsWithBlockReferences'
import { findDocumentsWithRelationshipReferences } from './findDocumentsWithRelationshipReferences'
import type { DocumentForRevalidation, RevalidationReference } from './revalidateDocument'

const ROUTABLE_COLLECTIONS = ['pages', 'posts', 'homePages', 'events'] as const

/**
 * Create a stable key for deduplication and comparison of DocumentForRevalidation results.
 */
function docKey(doc: DocumentForRevalidation): string {
  return `${doc.collection}:${doc.id}`
}

/**
 * Query the new documentReferences field across all routable collections
 * to find documents referencing the given collection/id.
 */
async function findDocumentsWithNewSystem(
  reference: RevalidationReference,
): Promise<DocumentForRevalidation[]> {
  const payload = await getPayload({ config: configPromise })
  const results: DocumentForRevalidation[] = []

  for (const collection of ROUTABLE_COLLECTIONS) {
    try {
      const hasDrafts = collection !== 'homePages'
      const statusFilter = hasDrafts ? [{ _status: { equals: 'published' as const } }] : []

      const res = await payload.find({
        collection,
        where: {
          and: [
            ...statusFilter,
            { 'documentReferences.collection': { equals: reference.collection } },
            { 'documentReferences.docId': { equals: reference.id } },
          ],
        },
        depth: 0,
      })

      for (const doc of res.docs) {
        const slug = 'slug' in doc && typeof doc.slug === 'string' ? doc.slug : ''
        const tenant = doc.tenant
        if (typeof tenant !== 'number' && (typeof tenant !== 'object' || tenant === null)) continue

        results.push({
          collection,
          id: doc.id,
          slug,
          tenant: tenant satisfies number | { id: number; slug: string },
        })
      }
    } catch (error) {
      payload.logger.warn(
        `[revalidation-compare] Error querying ${collection} with new system for ${reference.collection} ID ${reference.id}: ${error}`,
      )
    }
  }

  return results
}

/**
 * Compare results from the old revalidation system (block references + relationship references)
 * against the new documentReferences system, and log any differences.
 *
 * Gated by the ENABLE_REVALIDATION_COMPARISON_LOGGING environment variable.
 */
export async function compareRevalidationSystems(reference: RevalidationReference): Promise<void> {
  if (!process.env.ENABLE_REVALIDATION_COMPARISON_LOGGING) return

  const payload = await getPayload({ config: configPromise })
  const prefix = `[revalidation-compare] ${reference.collection} ID ${reference.id}`

  try {
    const [blockRefs, relationshipRefs, newSystemRefs] = await Promise.all([
      findDocumentsWithBlockReferences(reference),
      findDocumentsWithRelationshipReferences(reference),
      findDocumentsWithNewSystem(reference),
    ])

    // Deduplicate old system results (block + relationship can overlap)
    const oldSystemMap = new Map<string, DocumentForRevalidation>()
    for (const doc of [...blockRefs, ...relationshipRefs]) {
      oldSystemMap.set(docKey(doc), doc)
    }

    const newSystemMap = new Map<string, DocumentForRevalidation>()
    for (const doc of newSystemRefs) {
      newSystemMap.set(docKey(doc), doc)
    }

    // References found by new system but missed by old (expected for deep nesting)
    const newOnly: DocumentForRevalidation[] = []
    for (const [key, doc] of newSystemMap) {
      if (!oldSystemMap.has(key)) {
        newOnly.push(doc)
      }
    }

    // References found by old system but missed by new (unexpected -- indicates a bug)
    const oldOnly: DocumentForRevalidation[] = []
    for (const [key, doc] of oldSystemMap) {
      if (!newSystemMap.has(key)) {
        oldOnly.push(doc)
      }
    }

    payload.logger.info(
      `${prefix}: old system found ${oldSystemMap.size}, new system found ${newSystemMap.size}`,
    )

    if (newOnly.length > 0) {
      payload.logger.info(
        `${prefix}: NEW SYSTEM ONLY (expected for deep nesting): ${newOnly.map(docKey).join(', ')}`,
      )
    }

    if (oldOnly.length > 0) {
      payload.logger.warn(
        `${prefix}: OLD SYSTEM ONLY (unexpected -- potential bug): ${oldOnly.map(docKey).join(', ')}`,
      )
    }

    if (newOnly.length === 0 && oldOnly.length === 0) {
      payload.logger.info(`${prefix}: systems match perfectly`)
    }
  } catch (error) {
    payload.logger.error(`${prefix}: comparison failed: ${error}`)
  }
}
