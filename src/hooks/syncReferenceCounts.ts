import {
  REFERENCE_COUNTED_COLLECTIONS,
  type ReferenceCountedCollection,
} from '@/constants/sharedContent'
import { findDocumentsWithReferences } from '@/utilities/findDocumentsWithReferences'
import { isRecord } from '@/utilities/isRecord'
import type { CollectionAfterChangeHook, CollectionAfterDeleteHook, PayloadRequest } from 'payload'

type CountedReference = { collection: ReferenceCountedCollection; id: number }

const countedSlugs: ReadonlySet<string> = new Set(REFERENCE_COUNTED_COLLECTIONS)

function isCountedCollection(slug: unknown): slug is ReferenceCountedCollection {
  return typeof slug === 'string' && countedSlugs.has(slug)
}

/** The counted documents a referencing document points at, read off its own documentReferences. */
function countedReferences(doc: unknown): CountedReference[] {
  if (!isRecord(doc) || !Array.isArray(doc.documentReferences)) return []

  return doc.documentReferences.flatMap((entry) => {
    if (!isRecord(entry) || typeof entry.docId !== 'number') return []
    return isCountedCollection(entry.collection)
      ? [{ collection: entry.collection, id: entry.docId }]
      : []
  })
}

function dedupe(references: CountedReference[]): CountedReference[] {
  const byKey = new Map(references.map((ref) => [`${ref.collection}:${ref.id}`, ref]))
  return [...byKey.values()]
}

/**
 * Recomputes rather than increments. A missed event leaves one stale number that the next save of
 * any document touching it corrects, where a drifting counter would stay wrong forever.
 */
async function recount(references: CountedReference[], req: PayloadRequest): Promise<void> {
  for (const reference of references) {
    const referenceCount = (
      await findDocumentsWithReferences(reference, { includeDrafts: true, req })
    ).length

    await req.payload.update({
      collection: reference.collection,
      id: reference.id,
      data: { referenceCount },
      req,
      depth: 0,
      // Bumping a count changes nothing anyone renders, and revalidating here would fan back out
      // to every page that uses the document we are counting.
      context: { disableRevalidate: true },
    })
  }
}

/**
 * Keeps `referenceCount` current on Shared Content. Registered on every collection that carries
 * `documentReferencesField()`, because that is where a reference is actually recorded.
 */
export const syncReferenceCounts: CollectionAfterChangeHook = async ({ doc, previousDoc, req }) => {
  // Both sides: a reference that was just removed needs its old target recounted too
  await recount(dedupe([...countedReferences(previousDoc), ...countedReferences(doc)]), req)
}

export const syncReferenceCountsOnDelete: CollectionAfterDeleteHook = async ({ doc, req }) => {
  await recount(countedReferences(doc), req)
}
