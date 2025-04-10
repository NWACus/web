import { z } from 'zod'

const absoluteUrlSchema = z
  .string()
  .url()
  .refine(
    (url) => {
      try {
        return new URL(url).protocol !== ''
      } catch {
        return false
      }
    },
    { message: 'Must be an absolute URL with a protocol' },
  )

export default function isAbsoluteUrl(url?: string | null) {
  if (url == null) return false

  const result = absoluteUrlSchema.safeParse(url)
  return result.success
}
