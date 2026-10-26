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

/** The stored counts of the documents that still exist; a deleted one simply has no entry. */
async function storedCounts(
  collection: ReferenceCountedCollection,
  ids: number[],
  req: PayloadRequest,
): Promise<Map<number, number | null | undefined>> {
  const { docs } = await req.payload.find({
    collection,
    where: { id: { in: ids } },
    select: { referenceCount: true },
    depth: 0,
    limit: 0,
    pagination: false,
    req,
  })
  return new Map(docs.map((doc) => [doc.id, doc.referenceCount]))
}

async function recountOne(
  reference: CountedReference,
  storedCount: number | null | undefined,
  req: PayloadRequest,
): Promise<void> {
  const uses = await findDocumentsWithReferences(reference, { includeDrafts: true, req })
  if (uses.length === storedCount) return

  await req.payload.db.updateOne({
    collection: reference.collection,
    id: reference.id,
    // An explicit null tells the adapter to leave `updatedAt` alone rather than stamp it
    data: { referenceCount: uses.length, updatedAt: null },
    req,
    returning: false,
  })
}

/**
 * Recomputes rather than increments, so a missed event leaves one stale number that the next save
 * touching the document corrects. Writes straight through the adapter: a count is not an edit, so
 * it runs no hooks, keeps `updatedAt` and edit locks as they are, and leaves `req.context` alone.
 */
async function recount(references: CountedReference[], req: PayloadRequest): Promise<void> {
  for (const collection of REFERENCE_COUNTED_COLLECTIONS) {
    const inCollection = references.filter((ref) => ref.collection === collection)
    if (inCollection.length === 0) continue

    const stored = await storedCounts(
      collection,
      inCollection.map((ref) => ref.id),
      req,
    )
    // A deleted document has no stored count, and a stale reference to it is not an error
    for (const reference of inCollection.filter((ref) => stored.has(ref.id))) {
      await recountOne(reference, stored.get(reference.id), req)
    }
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
