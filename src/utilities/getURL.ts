import canUseDOM from './canUseDOM'
import { PROTOCOL, ROOT_DOMAIN } from './domain'
import isAbsoluteUrl from './isAbsoluteUrl'

export function getURL(hostname?: string | null) {
  if (canUseDOM) {
    const protocol = window.location.protocol
    const domain = window.location.hostname
    const port = window.location.port

    return `${protocol}//${domain}${port ? `:${port}` : ''}`
  }

  return `${PROTOCOL}://${hostname || ROOT_DOMAIN}`
}

/**
 * Processes media resource URL to ensure proper formatting
 * @param url The original URL from the resource
 * @param cacheTag Optional cache tag to append to the URL
 * @returns Properly formatted URL with cache tag if provided
 */
export const getMediaURL = (
  url: string | null | undefined,
  cacheTag?: string | null,
  hostname?: string | null,
): string => {
  if (!url) return ''

  // Check if URL is absolute url
  if (isAbsoluteUrl(url)) {
    return cacheTag ? `${url}?${cacheTag}` : url
  }

  // Otherwise assume it's a relative path and prepend base url
  const baseUrl = getURL(hostname)
  return cacheTag ? `${baseUrl}${url}?${cacheTag}` : `${baseUrl}${url}`
}
