import type { FieldHook } from 'payload'

export const formatSlug = (val: string | null): string => {
  if (!val) return ''

  return val
    .trim()
    .replace(/ /g, '-')
    .replace(/[^\w-]+/g, '')
    .toLowerCase()
}

// Formats a date value as `YYYY-MM-DD` (UTC) for use in a slug; returns '' if not a valid date.
export const formatDateForSlug = (value: unknown): string => {
  if (typeof value !== 'string' && !(value instanceof Date)) {
    return ''
  }

  const date = new Date(value)
  if (isNaN(date.getTime())) {
    return ''
  }

  return date.toISOString().slice(0, 10)
}

export const formatSlugHook =
  (fallback: string): FieldHook =>
  ({ data, operation, value }) => {
    if (typeof value === 'string') {
      return formatSlug(value)
    }

    if (operation === 'create' || !data?.slug) {
      const fallbackData = data?.[fallback] || data?.[fallback]

      if (fallbackData && typeof fallbackData === 'string') {
        return formatSlug(fallbackData)
      }
    }

    return value
  }
