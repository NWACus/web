import { TextFieldSingleValidation } from 'payload'

/**
 * Validates whether a string is a valid, full URL with protocol, host, and proper TLD
 */
const isValidFullUrl = (url?: string | null): boolean => {
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

export const validateExternalUrl: TextFieldSingleValidation = (val) =>
  isValidFullUrl(val) ||
  'URL must be a valid, full URL with http/https protocol. I.e. https://www.example.com.'
