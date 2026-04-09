import { Field } from 'payload'

/** Populated by the populateDocumentReferences beforeChange hook. Hidden in admin UI. */
export const documentReferencesField = (): Field => ({
  name: 'documentReferences',
  type: 'array',
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
