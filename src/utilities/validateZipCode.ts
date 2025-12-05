import { TextFieldSingleValidation } from 'payload'
import { z } from 'zod'

// Zod schema for US ZIP codes (5 digits or 5+4 format)
export const zipCodeSchema = z
  .string()
  .regex(/^\d{5}(-\d{4})?$/, 'ZIP code must be 5 digits or 5+4 format (e.g., 12345 or 12345-6789)')

export const validateZipCode: TextFieldSingleValidation = (value) => {
  if (value === null || value === undefined || value === '') {
    return true // Allow empty values - add required: true to field if needed
  }

  try {
    zipCodeSchema.parse(value)
    return true
  } catch (error) {
    if (error instanceof z.ZodError) {
      return error.errors[0]?.message || 'Invalid ZIP code'
    }
    return 'Invalid ZIP code'
  }
}
