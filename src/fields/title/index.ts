import { FieldHook, TextField } from 'payload'

export const setDuplicateSlug: FieldHook = async ({ value }) => {
  if (!value || typeof value !== 'string') {
    return value
  }

  return `${value} - Copy`
}
export const titleField = ({
  isRequired = true,
  description,
}: {
  isRequired?: boolean
  description?: string
} = {}): TextField => ({
  name: 'title',
  type: 'text',
  required: isRequired,
  hooks: {
    beforeDuplicate: [setDuplicateSlug],
  },
  ...(description && { admin: { description } }),
})
