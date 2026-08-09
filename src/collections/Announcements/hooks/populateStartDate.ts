import type { CollectionBeforeChangeHook } from 'payload'

export const populateStartDate: CollectionBeforeChangeHook = ({ data, operation, req }) => {
  if (operation === 'create' && req.data && !req.data.startDate) {
    return {
      ...data,
      startDate: new Date(),
    }
  }
  return data
}
