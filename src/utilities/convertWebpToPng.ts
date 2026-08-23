import { Media, Tenant } from '@/payload-types'
import { getMediaURL } from '@/utilities/getURL'
import { getHostnameFromTenant } from '@/utilities/tenancy/getHostnameFromTenant'
import sharp from 'sharp'

// Some assets carry a WebP mimeType without a .webp filename (or vice versa), so
// check both — otherwise Satori is handed a WebP it can't render.
export function isWebpMedia(media: Media): boolean {
  return (
    media.mimeType?.toLowerCase() === 'image/webp' ||
    Boolean(media.filename?.toLowerCase().endsWith('.webp'))
  )
}

export async function convertWebpToPng(media: Media, tenant: Tenant): Promise<string> {
  const { url, updatedAt } = media
  const hostname = getHostnameFromTenant(tenant)
  const mediaUrl = getMediaURL(url, updatedAt, hostname)

  if (!isWebpMedia(media)) {
    // Return original URL if not WebP
    return mediaUrl
  }

  try {
    // Fetch the WebP image
    const response = await fetch(mediaUrl)
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`)
    }

    const webpBuffer = await response.arrayBuffer()

    // Convert WebP to PNG using Sharp
    const pngBuffer = await sharp(Buffer.from(webpBuffer)).png().toBuffer()

    // Convert to base64 data URL for use in ImageResponse
    const base64 = pngBuffer.toString('base64')
    return `data:image/png;base64,${base64}`
  } catch (error) {
    console.error('Error converting WebP to PNG:', error)
    // Fallback to original URL if conversion fails
    return mediaUrl
  }
}
