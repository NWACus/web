/**
 * A forecast media item paired with the sanitized HTML of its caption.
 *
 * The lightbox writes a caption with `dangerouslySetInnerHTML` and is a `'use client'` component,
 * so sanitizing there would ship `sanitize-html` — and htmlparser2's tokenizer behind it — to every
 * reader of a forecast page. Carrying the sanitized caption alongside the item keeps the library on
 * the server, and puts the obligation in the type: nothing reaches the lightbox as a bare
 * `MediaItem`, so a new call site cannot quietly hand it forecaster HTML that nobody cleaned.
 *
 * `item` keeps its authored caption. It is only ever read as plain text — `resolveMediaSlide` uses
 * it for a slide's `alt` and `title`, which React escapes — so a slide's accessible name is
 * unchanged by moving the sanitizing to the server.
 *
 * The builders below reach `sanitize-html` and are server-only. A client component may import the
 * `LightboxMedia` type from here (`import type` is erased), never the functions.
 */
import type { MediaItem } from '@/services/nac/model/forecast'

import { displayableMedia, getCaption } from './mediaItem'
import { sanitizeHtml } from './sanitizeHtml'

export interface LightboxMedia {
  item: MediaItem
  /** The item's caption as sanitized HTML, or `null` when it has no caption. */
  captionHtml: string | null
}

/** One media item, with its caption sanitized. */
export function toLightboxMedia(item: MediaItem): LightboxMedia {
  const caption = getCaption(item)
  return { item, captionHtml: caption ? sanitizeHtml(caption) : null }
}

/** A product's displayable media, each item with its caption sanitized. */
export function toLightboxMediaList(items: MediaItem[]): LightboxMedia[] {
  return displayableMedia(items).map(toLightboxMedia)
}
