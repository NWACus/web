import configPromise from '@payload-config'
import type { CollectionSlug, Field, SelectType, Where } from 'payload'
import { getPayload } from 'payload'
import { isTenantValue } from './isTenantValue'
import { DocumentReference } from './revalidateDocument'

export interface ReferenceQuery {
  collection: string
  id: number
}

export interface FindDocumentsWithReferencesOptions {
  /**
   * Include drafts. Revalidation wants published documents only; an editor deciding whether a
   * change to a shared document is safe wants to see the unpublished uses too.
   */
  includeDrafts?: boolean
}

interface ReferencingCollection {
  slug: string
  hasDrafts: boolean
  hasTitle: boolean
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
  if (collection.hasTitle) select.title = true
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
      title: optionalString(record['title']),
      status: optionalString(record['_status']),
    },
  ]
}

/** Find all documents whose `documentReferences` field contains a reference to the given document. */
export async function findDocumentsWithReferences(
  reference: ReferenceQuery,
  { includeDrafts = false }: FindDocumentsWithReferencesOptions = {},
): Promise<DocumentReference[]> {
  const payload = await getPayload({ config: configPromise })

  const allSlugs = new Set(payload.config.collections.map((c) => c.slug))
  const hasField = (fields: Field[], name: string) =>
    fields.some((f) => 'name' in f && f.name === name)

  const collectionsWithReferences: ReferencingCollection[] = payload.config.collections
    .filter((c) => hasField(c.fields, 'documentReferences'))
    .map((c) => ({
      slug: c.slug,
      hasDrafts: Boolean(c.versions && c.versions.drafts),
      hasTitle: hasField(c.fields, 'title'),
    }))

  const settled = await Promise.allSettled(
    collectionsWithReferences.map(async (collection) => {
      if (!isCollectionSlug(collection.slug, allSlugs)) return []

      const res = await payload.find({
        collection: collection.slug,
        where: buildWhere(reference, collection, includeDrafts),
        select: buildSelect(collection),
        depth: 1,
        limit: 0,
      })

      return res.docs.flatMap((doc) => toDocumentReference(doc, collection))
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
