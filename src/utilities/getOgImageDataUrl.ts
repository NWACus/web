import { Media, Tenant } from '@/payload-types'
import { getMediaURL } from '@/utilities/getURL'
import { getHostnameFromTenant } from '@/utilities/tenancy/getHostnameFromTenant'
import sharp from 'sharp'

// Returns a media image as a PNG data URL for an OG image: transcoded because Satori can't embed
// our WebP media, and pre-resized to ~2x display height so it isn't downscaled soft at render time.
// TODO: the PNG transcode can go once WebP support lands in Satori
// (https://github.com/vercel/satori/pull/622); the resize step stays regardless.
export async function getOgImageDataUrl(
  media: Media,
  tenant: Tenant,
  displayHeight: number,
): Promise<string | null> {
  const mediaUrl = getMediaURL(media.url, media.updatedAt, getHostnameFromTenant(tenant))

  try {
    const response = await fetch(mediaUrl)
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`)
    }

    const buffer = Buffer.from(await response.arrayBuffer())
    const png = await sharp(buffer)
      // 2x for retina sharpness; never upscale a source that's already smaller
      .resize({ height: Math.round(displayHeight * 2), withoutEnlargement: true })
      .png()
      .toBuffer()

    return `data:image/png;base64,${png.toString('base64')}`
  } catch (error) {
    console.error('Error preparing OG image:', error)
    return null
  }
}
