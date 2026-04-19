import { isRecord } from '@/utilities/isRecord'
import { CollectionBeforeChangeHook } from 'payload'

export const clearUnusedTabData: CollectionBeforeChangeHook = ({ data }) => {
  for (const tab of Object.values(data)) {
    if (isRecord(tab)) {
      const mode = isRecord(tab.options) && tab.options.displayMode
      if (mode === 'dropdown') {
        // Null each sub-field — setting the group to null alone doesn't clear the DB columns.
        tab.link = {
          type: 'internal',
          reference: null,
          url: null,
          label: null,
          newTab: null,
        }
      } else if (mode === 'link' || mode === 'button') {
        tab.items = []
      }
    }
  }
  return data
}
