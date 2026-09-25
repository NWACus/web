import { isRecord } from '@/utilities/isRecord'
import type { FieldHook } from 'payload'

export const formatSlug = (val: string | null): string => {
  if (!val) return ''

  return (
    val
      .trim()
      // validateSlug allows only letters, numbers and hyphens, so underscores separate words like spaces
      .replace(/[ _]/g, '-')
      .replace(/[^a-zA-Z0-9-]+/g, '')
      // Stripped punctuation between spaces leaves hyphen runs ("1 + Rescue" → "1--rescue"); collapse them, then trim the ends
      .replace(/-{2,}/g, '-')
      .replace(/^-|-$/g, '')
      .toLowerCase()
  )
}

// Joins the parts of an auto-generated slug. Shared by the server hook and the regenerate button so
// they agree; without the source-field part there is nothing to generate.
export const composeSlug = (parts: { prefix?: string; base: string; date?: string }): string =>
  parts.base ? [parts.prefix, parts.base, parts.date].filter(Boolean).join('-') : ''

// Reads the slug off a fetched document (REST response or Local API result); '' when absent.
export const slugOf = (doc: unknown): string =>
  isRecord(doc) && typeof doc.slug === 'string' ? doc.slug : ''

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
