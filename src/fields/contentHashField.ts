import { Field } from 'payload'

export const contentHashField = (): Field => {
  return {
    name: 'contentHash',
    type: 'text',
    required: false,
    admin: {
      hidden: true,
      disableListColumn: true,
      disableListFilter: true,
    },
  }
}
