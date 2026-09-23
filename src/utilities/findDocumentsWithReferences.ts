import configPromise from '@payload-config'
import type { CollectionSlug, Field, Payload, PayloadRequest, SelectType, Where } from 'payload'
import { getPayload } from 'payload'
import { isTenantValue } from './isTenantValue'
import { DocumentReference } from './revalidateDocument'

export interface ReferenceQuery {
  collection: string
  id: number
}

export interface FindDocumentsWithReferencesOptions {
  /**
   * Include drafts, including a newer draft of a published document. Revalidation wants published
   * documents only; an editor deciding whether a change to a shared document is safe wants to see
   * the unpublished uses too.
   */
  includeDrafts?: boolean
  /**
   * The request to run inside. A hook counting references for the document it is currently saving
   * has to see that save, which has not been committed yet — without the request it queries outside
   * the transaction and reads the state from before the hook ran.
   */
  req?: PayloadRequest
}

interface ReferencingCollection {
  slug: string
  hasDrafts: boolean
  /** The collection's `useAsTitle`, when it names a real field */
  titleField?: string
}

function isCollectionSlug(slug: string, allSlugs: Set<string>): slug is CollectionSlug {
  return allSlugs.has(slug)
}

function buildWhere(
  reference: ReferenceQuery,
  collection: ReferencingCollection,
  includeDrafts: boolean,
): Where {
  // Only filter by _status for collections with drafts enabled
  const conditions: Where[] =
    collection.hasDrafts && !includeDrafts ? [{ _status: { equals: 'published' } }] : []
  conditions.push(
    { 'documentReferences.collection': { equals: reference.collection } },
    { 'documentReferences.docId': { equals: reference.id } },
  )
  return { and: conditions }
}

function buildSelect(collection: ReferencingCollection): SelectType {
  const select: SelectType = { id: true, slug: true, tenant: true }
  if (collection.titleField) select[collection.titleField] = true
  if (collection.hasDrafts) select._status = true
  return select
}

function optionalString(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined
}

function toDocumentReference(
  doc: { id: number },
  collection: ReferencingCollection,
): DocumentReference[] {
  // Payload's generated types don't have index signatures
  const record: Record<string, unknown> = { ...doc }
  const tenant = record['tenant']
  if (!isTenantValue(tenant)) return []

  return [
    {
      collection: collection.slug,
      id: doc.id,
      slug: optionalString(record['slug']) ?? '',
      tenant,
      title: collection.titleField ? optionalString(record[collection.titleField]) : undefined,
      status: optionalString(record['_status']),
    },
  ]
}

// A document whose published row and latest draft both match is listed once, as the published row
function mergeById(published: DocumentReference[], drafts: DocumentReference[]) {
  const publishedIds = new Set(published.map((ref) => ref.id))
  return [...published, ...drafts.filter((ref) => !publishedIds.has(ref.id))]
}

async function queryCollection(
  payload: Payload,
  reference: ReferenceQuery,
  collection: ReferencingCollection & { slug: CollectionSlug },
  includeDrafts: boolean,
  req: PayloadRequest | undefined,
): Promise<DocumentReference[]> {
  const query = async (draft: boolean) => {
    const res = await payload.find({
      collection: collection.slug,
      where: buildWhere(reference, collection, includeDrafts),
      select: buildSelect(collection),
      depth: 1,
      limit: 0,
      draft,
      req,
    })
    return res.docs.flatMap((doc) => toDocumentReference(doc, collection))
  }

  const main = await query(false)
  if (!includeDrafts || !collection.hasDrafts) return main

  // Saving a draft of a published document writes only to the versions table, so the main row
  // misses whatever that draft just added
  return mergeById(main, await query(true))
}

/** Find all documents whose `documentReferences` field contains a reference to the given document. */
export async function findDocumentsWithReferences(
  reference: ReferenceQuery,
  { includeDrafts = false, req }: FindDocumentsWithReferencesOptions = {},
): Promise<DocumentReference[]> {
  const payload = req?.payload ?? (await getPayload({ config: configPromise }))

  const allSlugs = new Set(payload.config.collections.map((c) => c.slug))
  const hasField = (fields: Field[], name: string) =>
    fields.some((f) => 'name' in f && f.name === name)

  const collectionsWithReferences: ReferencingCollection[] = payload.config.collections
    .filter((c) => hasField(c.fields, 'documentReferences'))
    .map((c) => ({
      slug: c.slug,
      hasDrafts: Boolean(c.versions && c.versions.drafts),
      titleField: c.admin?.useAsTitle !== 'id' ? c.admin?.useAsTitle : undefined,
    }))

  const settled = await Promise.allSettled(
    collectionsWithReferences.map(async (collection) => {
      const { slug } = collection
      if (!isCollectionSlug(slug, allSlugs)) return []
      return queryCollection(payload, reference, { ...collection, slug }, includeDrafts, req)
    }),
  )

  const results: DocumentReference[] = []
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
