import { TextFieldSingleValidation } from 'payload'

export const validateSlug: TextFieldSingleValidation = (value) => {
  if (value === null || value === undefined) {
    return 'Slug must not be blank'
  }
  if (value?.includes('/')) {
    return 'Slug cannot contain /'
  }
  const slugPattern = /^[a-z0-9]+(?:-+[a-z0-9]+)*$/

  return slugPattern.test(value) || 'Invalid slug'
}
