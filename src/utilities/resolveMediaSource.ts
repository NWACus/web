import type { Media, SharedMedia } from '@/payload-types'

type MediaValue = Media | number | null | undefined
type SharedMediaValue = SharedMedia | number | null | undefined

/**
 * Picks the document an image slot should render. A slot only reaches for the shared library when
 * it explicitly says so, so a slot saved before the source choice existed — including a block
 * stored as JSON inside Post rich text — still resolves to the center's own Media.
 */
export function resolveMediaSource({
  source,
  media,
  sharedMedia,
}: {
  source?: string | null
  media?: MediaValue
  sharedMedia?: SharedMediaValue
}): Media | SharedMedia | number | null | undefined {
  return source === 'shared' ? sharedMedia : media
}
