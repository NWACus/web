import { TextFieldSingleValidation } from 'payload'

export const validateSlug: TextFieldSingleValidation = (value) => {
  if (value === null || value === undefined) {
    return 'Slug must not be blank'
  }
  if (value?.includes('/')) {
    return 'Slug cannot contain /'
  }
  // checks for kebab-case strings: allows letters, numbers and -
  const slugPattern = /^[a-zA-Z0-9]+(?:-+[a-zA-Z0-9]+)*$/

  return slugPattern.test(value) || 'Invalid slug: must be letters, numbers, or -'
}
