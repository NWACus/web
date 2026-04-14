import { Field } from 'payload'

/**
 * Reusable field definition for tracking all document references within a collection.
 * Intended to be populated by the populateDocumentReferences beforeChange hook.
 * Hidden in admin UI — visible in API responses.
 */
export const documentReferencesField = (): Field => ({
  name: 'documentReferences',
  type: 'array',
  admin: {
    disabled: true,
  },
  fields: [
    { name: 'collection', type: 'text' },
    { name: 'docId', type: 'number' },
    { name: 'instances', type: 'json' },
  ],
})
