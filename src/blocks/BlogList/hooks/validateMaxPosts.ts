import { FieldHook } from 'payload'

export const validateMaxPosts: FieldHook = ({ value }) => {
  if (value === undefined || value === null) {
    return value // Allow empty values since field is optional
  }

  const num = Number(value)

  if (!Number.isInteger(num) || num <= 0) {
    throw new Error('Max posts must be a positive whole number')
  }

  return value
}
