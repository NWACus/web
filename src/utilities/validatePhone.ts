import { TextFieldSingleValidation } from 'payload'
import { text } from 'payload/shared'
import { z } from 'zod'

// Zod schema for US phone numbers
// Accepts formats: (123) 456-7890, 123-456-7890, 123.456.7890, 1234567890, +1 123 456 7890, etc.
// Requires exactly 10 digits (or 11 with +1 country code)
export const phoneSchema = z
  .string()
  .regex(
    /^(\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})$/,
    'Phone number must be valid (e.g., (123) 456-7890, 123-456-7890, or 1234567890)',
  )

export const validatePhone: TextFieldSingleValidation = (value, args) => {
  if (value === null || value === undefined || value === '') {
    return text(value, args) // Allow empty values - add required: true to field if needed
  }

  try {
    phoneSchema.parse(value)
    return text(value, args)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return error.errors[0]?.message || 'Invalid phone number'
    }
    return 'Invalid phone number'
  }
}
