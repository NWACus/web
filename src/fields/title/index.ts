import { FieldHook, TextField } from 'payload'

export const setDuplicateSlug: FieldHook = async ({ value }) => {
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
    beforeDuplicate: [setDuplicateSlug],
  },
  ...(description && { admin: { description } }),
})
