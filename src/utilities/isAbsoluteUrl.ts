/**
 * Validates whether a string is an absolute URL with a protocol
 */
export default function isAbsoluteUrl(url?: string | null) {
  if (url == null) return false

  try {
    const urlObj = new URL(url)
    return urlObj.protocol !== ''
  } catch {
    return false
  }
}
