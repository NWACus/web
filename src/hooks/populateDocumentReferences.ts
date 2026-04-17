import type { CollectionBeforeChangeHook } from 'payload'

import { extractDocumentReferences } from '@/utilities/extractDocumentReferences'

/**
 * Generic beforeChange hook that populates the `documentReferences` field
 * by walking the full document and extracting all relationship/upload references.
 *
 * Works for any collection — uses the collection's resolved field config
 * so it handles all field types including richText with BlocksFeature at any
 * nesting depth.
 */
export const populateDocumentReferences: CollectionBeforeChangeHook = ({
  data,
  originalDoc,
  collection,
}) => {
  const merged = { ...originalDoc, ...data }
  const documentReferences = extractDocumentReferences(collection.fields, merged)

  return {
    ...data,
    documentReferences,
  }
}
