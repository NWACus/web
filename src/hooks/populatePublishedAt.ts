import type { CollectionBeforeChangeHook } from 'payload'

export const populatePublishedAt: CollectionBeforeChangeHook = ({
  data,
  operation,
  originalDoc,
  req,
}) => {
  if (operation === 'create' && req.data && !req.data.publishedAt) {
    const now = new Date()
    return {
      ...data,
      publishedAt: now,
    }
  }

  if (operation === 'update') {
    let publishedAtDate
    if (req.data && !req.data.publishedAt) {
      publishedAtDate = new Date()
    }
    if (req.data && req.data._status === 'draft' && originalDoc._status === 'published') {
      publishedAtDate = null
    }
    return {
      ...data,
      publishedAt: publishedAtDate,
    }
  }

  return data
}
