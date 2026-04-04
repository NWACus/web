import { Field } from 'payload'

/**
 * Reusable field definition for tracking all document references within a routable collection.
 * Populated automatically by the populateDocumentReferences beforeChange hook.
 * Hidden in admin UI — visible in API responses.
 */
export const documentReferencesField = (): Field => ({
  name: 'documentReferences',
  type: 'array',
  access: {
    update: () => false,
  },
  admin: {
    disabled: true,
    readOnly: true,
  },
  fields: [
    { name: 'collection', type: 'text' },
    { name: 'docId', type: 'number' },
    { name: 'blockType', type: 'text' },
    { name: 'fieldPath', type: 'text' },
  ],
})
