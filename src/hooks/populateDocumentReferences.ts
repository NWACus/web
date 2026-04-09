import type { CollectionBeforeChangeHook } from 'payload'

import { extractDocumentReferences } from '@/utilities/extractDocumentReferences'

/** Populates the `documentReferences` field by extracting all relationship/upload references. */
export const populateDocumentReferences: CollectionBeforeChangeHook = ({ data, collection }) => {
  const documentReferences = extractDocumentReferences(collection.fields, data)

  return {
    ...data,
    documentReferences,
  }
}
