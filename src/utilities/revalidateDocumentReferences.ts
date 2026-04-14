import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { findDocumentsWithReferences, ReferenceQuery } from './findDocumentsWithReferences'
import {
  DocumentForRevalidation,
  revalidateDocument,
  RevalidationReference,
  ROUTABLE_COLLECTIONS,
} from './revalidateDocument'

export interface RevalidationDeps {
  findRefs: (ref: ReferenceQuery) => Promise<DocumentForRevalidation[]>
  revalidateDoc: (doc: DocumentForRevalidation) => Promise<void>
}

const defaultDeps: RevalidationDeps = {
  findRefs: findDocumentsWithReferences,
  revalidateDoc: revalidateDocument,
}

async function revalidateRecursive(
  reference: RevalidationReference,
  visited: Set<string>,
  deps: RevalidationDeps,
): Promise<DocumentForRevalidation[]> {
  const key = `${reference.collection}:${reference.id}`
  if (visited.has(key)) return []
  visited.add(key)

  const docs = await deps.findRefs(reference)

  const revalidated: DocumentForRevalidation[] = []

  for (const doc of docs) {
    const docKey = `${doc.collection}:${doc.id}`

    if (ROUTABLE_COLLECTIONS.has(doc.collection)) {
      if (visited.has(docKey)) continue
      visited.add(docKey)
      await deps.revalidateDoc(doc)
      revalidated.push(doc)
    } else {
      // Non-routable intermediate collection — recurse to find routable documents beyond it
      // visited check happens at the top of the recursive call
      const nested = await revalidateRecursive(
        { collection: doc.collection, id: doc.id },
        visited,
        deps,
      )
      revalidated.push(...nested)
    }
  }

  return revalidated
}

/** Revalidate all routable documents that reference a specific document, recursing through intermediate collections. */
export async function revalidateDocumentReferences(
  reference: RevalidationReference,
  deps: RevalidationDeps = defaultDeps,
): Promise<void> {
  const payload = await getPayload({ config: configPromise })
  payload.logger.info(
    `Starting document reference revalidation for ${reference.collection} ID ${reference.id}`,
  )

  try {
    const visited = new Set<string>()
    const revalidated = await revalidateRecursive(reference, visited, deps)

    payload.logger.info(
      `Revalidated ${revalidated.length} routable documents for ${reference.collection} ID ${reference.id}`,
    )
  } catch (error) {
    payload.logger.error(
      `Error during document reference revalidation for ${reference.collection} ID ${reference.id}: ${error}`,
    )
  }
}
