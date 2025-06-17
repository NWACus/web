import { getClientSideURL } from '@/utilities/getURL'
import isAbsoluteUrl from './isAbsoluteUrl'

/**
 * Processes media resource URL to ensure proper formatting
 * @param url The original URL from the resource
 * @param cacheTag Optional cache tag to append to the URL
 * @returns Properly formatted URL with cache tag if provided
 */
export const getMediaUrl = (url: string | null | undefined, cacheTag?: string | null): string => {
  if (!url) return ''

  // Check if URL is absolute url
  if (isAbsoluteUrl(url)) {
    return cacheTag ? `${url}?${cacheTag}` : url
  }

  // Otherwise assume it's a relative path and prepend base url
  const baseUrl = getClientSideURL()
  return cacheTag ? `${baseUrl}${url}?${cacheTag}` : `${baseUrl}${url}`
}
