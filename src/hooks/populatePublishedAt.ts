import type { CollectionBeforeChangeHook } from 'payload'

export const populatePublishedAt: CollectionBeforeChangeHook = ({
  data,
  operation,
  originalDoc,
  req,
}) => {
  // On create: auto-set publishedAt if not provided
  if (operation === 'create' && req.data && !req.data.publishedAt) {
    return {
      ...data,
      publishedAt: new Date(),
    }
  }

  if (operation === 'update' && req.data) {
    // When transitioning from published to draft, clear the date
    if (req.data._status === 'draft' && originalDoc._status === 'published') {
      return {
        ...data,
        publishedAt: null,
      }
    }

    // If no publishedAt provided, auto-set to now
    if (!req.data.publishedAt) {
      return {
        ...data,
        publishedAt: new Date(),
      }
    }
  }

  // Otherwise, preserve whatever is in data (including user-provided dates)
  return data
}
