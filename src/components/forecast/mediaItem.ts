/**
 * Pure decisions about a forecast `MediaItem`: which URL to show, and what kind of slide it is.
 *
 * These live outside the lightbox components so the branching is testable on its own — the
 * components then only render, and stay well under the complexity thresholds.
 */
import { MediaType, type MediaItem } from '@/services/nac/model/forecast'
import { getVideoThumbnail } from '@/utilities/videoEmbed'

/** The small square shown in the thumbnail grid, or `null` if this item has no thumbnail. */
export function getThumbnailUrl(item: MediaItem): string | null {
  if (item.type === MediaType.Image) return item.url.thumbnail
  if (item.type === MediaType.Photo) return typeof item.url === 'string' ? item.url : null
  if (item.type === MediaType.Video) {
    if (typeof item.url === 'object' && 'thumbnail' in item.url) return item.url.thumbnail
    return youTubePoster(item)
  }
  return null
}

/**
 * The mid-size still to show inline, or `null` if there isn't one.
 *
 * This is the size the widget asks for when it shows a problem's example media, and for a video it
 * is the poster frame rather than the video itself.
 */
export function getPosterUrl(item: MediaItem): string | null {
  if (item.type === MediaType.Image) return item.url.medium
  if (item.type === MediaType.Photo) return typeof item.url === 'string' ? item.url : null
  if (item.type === MediaType.Video) {
    if (typeof item.url === 'object' && 'medium' in item.url) return item.url.medium
    return youTubePoster(item)
  }
  return null
}

/** The full-size image URL, or `null` if this item isn't a displayable still image. */
export function getFullUrl(item: MediaItem): string | null {
  if (item.type === MediaType.Image) return item.url.original
  if (item.type === MediaType.Photo) return typeof item.url === 'string' ? item.url : null
  return null
}

/**
 * Extract the YouTube `video_id` from a Video media item.
 *
 * A video's `url` is usually an object carrying image sizes plus `video_id`, but the AFP also
 * stores it as a bare string — and that string is the YouTube id, not a URL. The legacy widget
 * reads both (`image.url?.video_id ? … : "…/embed/" + image.url`).
 */
export function getYouTubeVideoId(item: MediaItem): string | null {
  if (item.type !== MediaType.Video) return null
  if (typeof item.url === 'string') return item.url || null
  if ('video_id' in item.url) return item.url.video_id
  return null
}

/** YouTube's own poster frame, for a video item that carries no image sizes of its own. */
function youTubePoster(item: MediaItem): string | null {
  const id = getYouTubeVideoId(item)
  return id ? getVideoThumbnail({ provider: 'youtube', id }) : null
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
  | { kind: 'unsupported' }

/**
 * Decide what a media item renders as in the lightbox, in priority order: an embedded YouTube
 * player, a zoomable still, or nothing we can display. PDFs and external links never reach the
 * lightbox; their tiles open them in a new tab (see `getMediaLink`).
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

  return { kind: 'unsupported' }
}

/** A PDF or external link, which the widget opens in a new tab rather than the lightbox. */
export interface MediaLink {
  kind: 'pdf' | 'external'
  href: string
  /** The forecaster's title (a PDF's is its filename), or `null` when it has none. */
  title: string | null
}

export function getMediaLink(item: MediaItem): MediaLink | null {
  if (item.type === MediaType.External) {
    return { kind: 'external', href: item.url.external_link, title: item.title || null }
  }
  if (item.type === MediaType.PDF) {
    return { kind: 'pdf', href: item.url.original, title: item.title || null }
  }
  return null
}

/** One Media grid tile: a link out, or a lightbox opener at its index in the lightbox's list. */
export type MediaGridTile<T> =
  | { kind: 'link'; media: T; link: MediaLink }
  | { kind: 'lightbox'; media: T; index: number }

/**
 * Lay out the Media grid in the product's order, and pull out the lightbox's own sequence, which
 * keeps images, photos and videos only, as the widget's does.
 */
export function mediaGridTiles<T extends { item: MediaItem }>(
  media: T[],
): { tiles: MediaGridTile<T>[]; lightbox: T[] } {
  const lightbox: T[] = []
  const tiles = media.map((entry): MediaGridTile<T> => {
    const link = getMediaLink(entry.item)
    if (link) return { kind: 'link', media: entry, link }
    lightbox.push(entry)
    return { kind: 'lightbox', media: entry, index: lightbox.length - 1 }
  })
  return { tiles, lightbox }
}
