import { TextFieldSingleValidation } from 'payload'
import { text } from 'payload/shared'

/**
 * Validates whether a string is a valid, full URL with protocol, host, and proper TLD
 */
export const isValidFullUrl = (url?: string | null): boolean => {
  if (url == null || typeof url !== 'string' || url.trim() === '') {
    return false
  }

  try {
    const urlObj = new URL(url)

    // Must have a valid protocol (http or https)
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      return false
    }

    // Must have a hostname
    if (!urlObj.hostname || urlObj.hostname === '') {
      return false
    }

    // Split hostname into parts to validate TLD
    const parts = urlObj.hostname.split('.')

    // Must have at least 2 parts (domain.tld)
    if (parts.length < 2) {
      return false
    }

    // Last part (TLD) must be 2-6 characters and contain only letters
    // This covers common TLDs like .com, .org, .edu, .museum, etc.
    const tld = parts[parts.length - 1]
    if (tld.length < 2 || tld.length > 6 || !/^[a-zA-Z]+$/.test(tld)) {
      return false
    }

    // Second-to-last part (domain name) must not be empty
    const domain = parts[parts.length - 2]
    if (!domain || domain.length === 0) {
      return false
    }

    return true
  } catch {
    return false
  }
}

/**
 * Validates URLs that don't require a hostname (mailto:, tel:, sms:)
 */
const isValidSchemeUrl = (url: string): boolean => {
  const schemeOnlyProtocols = ['mailto:', 'tel:', 'sms:']

  for (const protocol of schemeOnlyProtocols) {
    if (url.toLowerCase().startsWith(protocol)) {
      const value = url.slice(protocol.length)

      // Must have something after the protocol
      if (!value || value.trim() === '') {
        return false
      }

      // Basic validation for common cases
      if (protocol === 'mailto:') {
        // Simple email pattern check
        return /^[^\s@]+@[^\s@]+\.[^\s@]+/.test(value)
      }

      if (protocol === 'tel:' || protocol === 'sms:') {
        // Allow digits, spaces, hyphens, parentheses, plus sign
        return /^[\d\s\-\(\)\+]+$/.test(value)
      }

      return true
    }
  }

  return false
}

export const validateExternalUrl: TextFieldSingleValidation = (val, args) => {
  if (val == null || typeof val !== 'string' || val.trim() === '') {
    return text(val, args) // Allow empty values - add required: true to field if needed
  }

  const trimmedVal = val.trim()

  // Check for http/https
  if (isValidFullUrl(trimmedVal)) {
    return true
  }

  // Check for scheme-only URLs (mailto, tel, sms)
  if (isValidSchemeUrl(trimmedVal)) {
    return true
  }

  return 'URL must be a valid http://, https://, mailto:, tel:, or sms: URL'
}
