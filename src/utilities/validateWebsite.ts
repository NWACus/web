import { TextFieldSingleValidation } from 'payload'
import { z } from 'zod'
import isAbsoluteUrl from './isAbsoluteUrl'

// Zod schema for website URLs
export const websiteSchema = z.string().refine(
  (val) => {
    // If empty, it's valid (we allow optional URLs)
    if (!val) return true
    return isAbsoluteUrl(val)
  },
  {
    message: 'URL must be an absolute url with a protocol (e.g., https://www.example.com)',
  },
)

export const validateWebsite: TextFieldSingleValidation = (value) => {
  if (value === null || value === undefined || value === '') {
    return true // Allow empty values - add required: true to field if needed
  }

  try {
    websiteSchema.parse(value)
    return true
  } catch (error) {
    if (error instanceof z.ZodError) {
      return error.errors[0]?.message || 'Invalid URL'
    }
    return 'Invalid URL'
  }
}
