/**
 * Pure decisions about a forecast `MediaItem`: which URL to show, and what kind of slide it is.
 *
 * These live outside the lightbox components so the branching is testable on its own — the
 * components then only render, and stay well under the complexity thresholds.
 */
import { MediaType, type MediaItem } from '@/services/nac/model/forecast'

/** The small square shown in the thumbnail grid, or `null` if this item has no thumbnail. */
export function getThumbnailUrl(item: MediaItem): string | null {
  if (item.type === MediaType.Image) return item.url.thumbnail
  if (item.type === MediaType.Photo) return typeof item.url === 'string' ? item.url : null
  if (item.type === MediaType.Video) {
    if (typeof item.url === 'object' && 'thumbnail' in item.url) return item.url.thumbnail
    return null
  }
  return null
}

/** The full-size image URL, or `null` if this item isn't a displayable still image. */
export function getFullUrl(item: MediaItem): string | null {
  if (item.type === MediaType.Image) return item.url.original
  if (item.type === MediaType.Photo) return typeof item.url === 'string' ? item.url : null
  return null
}

/** Extract the YouTube `video_id` from a Video media item. */
export function getYouTubeVideoId(item: MediaItem): string | null {
  if (item.type !== MediaType.Video) return null
  if (typeof item.url === 'object' && 'video_id' in item.url) return item.url.video_id
  return null
}

export function getCaption(item: MediaItem): string | null {
  if ('caption' in item && item.caption) return item.caption
  return null
}

/** Media items with something to display in the lightbox. */
export function displayableMedia(items: MediaItem[]): MediaItem[] {
  return items.filter((item): item is MediaItem & { type: MediaType } => {
    const t = item.type
    return (
      t === MediaType.Image ||
      t === MediaType.Video ||
      t === MediaType.Photo ||
      t === MediaType.External ||
      t === MediaType.PDF
    )
  })
}

/** What a single lightbox slide should render. */
export type MediaSlideContent =
  | { kind: 'youtube'; videoId: string; title: string }
  | { kind: 'photo'; url: string; alt: string }
  | { kind: 'link'; href: string; label: string }
  | { kind: 'unsupported' }

/**
 * Decide what a media item renders as in the lightbox, in priority order: an embedded YouTube
 * player, a zoomable still, an outbound link (external media or PDF), or nothing we can display.
 */
export function resolveMediaSlide(item: MediaItem): MediaSlideContent {
  const videoId = getYouTubeVideoId(item)
  if (videoId) {
    return { kind: 'youtube', videoId, title: getCaption(item) ?? 'YouTube video' }
  }

  const fullUrl = getFullUrl(item)
  if (fullUrl) {
    return { kind: 'photo', url: fullUrl, alt: getCaption(item) ?? '' }
  }

  const link = getExternalLink(item)
  if (link) return link

  return { kind: 'unsupported' }
}

function getExternalLink(item: MediaItem): { kind: 'link'; href: string; label: string } | null {
  if (
    item.type === MediaType.External &&
    typeof item.url === 'object' &&
    'external_link' in item.url
  ) {
    return { kind: 'link', href: item.url.external_link, label: 'Open external media' }
  }
  if (item.type === MediaType.PDF && typeof item.url === 'object' && 'original' in item.url) {
    return { kind: 'link', href: item.url.original, label: 'Open PDF' }
  }
  return null
}
