import { Media, Tenant } from '@/payload-types'
import { getMediaURL } from '@/utilities/getURL'
import { getHostnameFromTenant } from '@/utilities/tenancy/getHostnameFromTenant'

export function getImgAttrsFromMediaResource(resource: Media, tenant: Tenant) {
  const {
    alt: altFromResource,
    height: fullHeight,
    url,
    width: fullWidth,
    blurDataUrl: blurDataURLFromResource,
  } = resource

  // The fallback values are not expected to be used but Payload types
  // result in these values potentially being undefined
  const width = fullWidth || 400
  const height = fullHeight || 300
  const alt = altFromResource || ''
  const blurDataURL = blurDataURLFromResource

  const cacheTag = resource.updatedAt

  const src = getMediaURL(url, cacheTag, getHostnameFromTenant(tenant))

  return { src, width, height, alt, blurDataURL }
}
