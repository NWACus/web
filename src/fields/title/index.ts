import { FieldHook, TextField } from 'payload'

export const getDuplicateSlug: FieldHook = async ({ value }) => {
  if (!value || typeof value !== 'string') {
    return value
  }

  return `${value} - Copy`
}
export const titleField = (
  { isRequired, description }: { isRequired?: boolean; description?: string } = {
    isRequired: true,
  },
): TextField => ({
  name: 'title',
  type: 'text',
  ...(isRequired && { required: isRequired }),
  hooks: {
    beforeDuplicate: [getDuplicateSlug],
  },
  ...(description && { admin: { description } }),
})
