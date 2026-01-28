import { NumberFieldValidation } from 'payload'
import { number } from 'payload/shared'

export const validateMaxPosts: NumberFieldValidation = (value, args) => {
  if (value === undefined || value === null) {
    return number(value, args) // Allow empty values since field is optional
  }

  const num = Number(value)

  if (!Number.isInteger(num) || num <= 0) {
    return 'Max posts must be a positive whole number'
  }

  return number(value, args)
}
