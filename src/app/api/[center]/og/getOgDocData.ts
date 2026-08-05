import { getImgAttrsFromMediaResource } from '@/components/Media/getImgAttrsFromMediaResource'
import type { Tenant } from '@/payload-types'
import { convertWebpToPng } from '@/utilities/convertWebpToPng'
import { formatDateTime } from '@/utilities/formatDateTime'
import type { Payload } from 'payload'
import type { OgDocType } from './buildOgImageUrl'

const META_SEPARATOR = '  •  '

export type OgDocData = {
  title: string
  description: string | null
  /** e.g. "By Jane Doe • Jan 5, 2026" (post) or "Jan 5, 2026 • Bend, OR" (event) */
  metaLine: string | null
  /** The document's own hero/featured image, when it has one. */
  image: { src: string; width: number; height: number } | null
}

/**
 * Fetches a published blog post or event by center + slug and normalizes it into
 * the fields the OG image renderer needs (title, description, a meta line, and the
 * document's own hero image). Returns null when no matching published document
 * exists, so the route can fall back to the generic center image.
 *
 * Inherently branchy: two collection shapes, an optional hero image (with WebP→PNG
 * for Satori), and per-type meta lines. Kept as one cohesive normalizer rather than
 * fragmented across tiny single-use helpers.
 */
// fallow-ignore-next-line complexity
export async function getOgDocData({
  payload,
  center,
  type,
  slug,
  tenant,
}: {
  payload: Payload
  center: string
  type: OgDocType
  slug: string
  tenant: Tenant
}): Promise<OgDocData | null> {
  const collection = type === 'post' ? 'posts' : 'events'

  const result = await payload.find({
    collection,
    depth: 1,
    limit: 1,
    pagination: false,
    where: {
      and: [
        { 'tenant.slug': { equals: center } },
        { slug: { equals: slug } },
        { _status: { equals: 'published' } },
      ],
    },
  })

  const doc = result.docs[0]
  if (!doc) return null

  // The document's own hero image, when present. Satori (used by @vercel/og) can't
  // render WebP yet, so convert to PNG.
  // TODO: remove the conversion once WebP support lands: https://github.com/vercel/satori/pull/622
  let image: OgDocData['image'] = null
  const featured = doc.featuredImage
  if (featured && typeof featured === 'object' && featured.url) {
    const attrs = getImgAttrsFromMediaResource(featured, tenant)
    const isWebp =
      featured.mimeType?.toLowerCase() === 'image/webp' ||
      featured.filename?.toLowerCase().endsWith('.webp')
    const src = isWebp ? await convertWebpToPng(featured, tenant) : attrs.src
    image = { src, width: attrs.width, height: attrs.height }
  }

  const parts: string[] = []

  if (type === 'post' && 'showAuthors' in doc) {
    if (doc.showAuthors) {
      const names = (doc.populatedAuthors ?? [])
        .map((author) => author.name)
        .filter((name): name is string => Boolean(name))
      if (names.length) parts.push(`By ${names.join(', ')}`)
    }
    if (doc.showDate && doc.publishedAt) {
      parts.push(formatDateTime(doc.publishedAt, null, 'MMM d, yyyy'))
    }
  } else if (type === 'event' && 'startDate' in doc) {
    if (doc.startDate) {
      parts.push(formatDateTime(doc.startDate, doc.startDate_tz, 'MMM d, yyyy'))
    }
    const location =
      doc.location?.placeName ||
      [doc.location?.city, doc.location?.state].filter(Boolean).join(', ')
    if (location) parts.push(location)
  } else {
    return null
  }

  return {
    title: doc.title,
    description: doc.description ?? null,
    metaLine: parts.join(META_SEPARATOR) || null,
    image,
  }
}
