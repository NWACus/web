import { NumberFieldValidation } from 'payload'

export const validateMaxPosts: NumberFieldValidation = (value) => {
  if (value === undefined || value === null) {
    return true // Allow empty values since field is optional
  }

  const num = Number(value)

  if (!Number.isInteger(num) || num <= 0) {
    return 'Max posts must be a positive whole number'
  }

  return true
}
