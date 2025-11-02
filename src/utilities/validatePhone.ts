import { TextFieldSingleValidation } from 'payload'
import { z } from 'zod'

// Zod schema for US phone numbers
// Accepts formats: (123) 456-7890, 123-456-7890, 123.456.7890, 1234567890, +1 123 456 7890, etc.
export const phoneSchema = z
  .string()
  .regex(
    /^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,4}[-\s\.]?[0-9]{1,9}$/,
    'Phone number must be valid (e.g., (123) 456-7890, 123-456-7890, or 1234567890)',
  )

export const validatePhone: TextFieldSingleValidation = (value) => {
  if (value === null || value === undefined || value === '') {
    return true // Allow empty values - add required: true to field if needed
  }

  try {
    phoneSchema.parse(value)
    return true
  } catch (error) {
    if (error instanceof z.ZodError) {
      return error.errors[0]?.message || 'Invalid phone number'
    }
    return 'Invalid phone number'
  }
}
