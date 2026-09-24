/**
 * Server-only: turns an observation or avalanche into the `DetailData` the detail components
 * render — HTML sanitized, galleries and the lightbox sequence arranged. See `./detailTypes`.
 */
import { toLightboxMedia, type LightboxMedia } from '@/components/forecast/lightboxMedia'
import { sanitizeSubmittedHtml } from '@/components/forecast/sanitizeHtml'
import { MediaType } from '@/services/nac/model/forecast'
import type { Avalanche, MediaItem, Observation } from '@/services/nac/model/observation'
import { avalancheCard } from '@/services/nac/observations/cards'

import type { AvalancheDetailData, GalleryTile, ObservationDetailData } from './detailTypes'

/** What the lightbox can show; everything else in a gallery opens in a new tab. */
function isViewable(item: MediaItem): boolean {
  return (
    item.type === MediaType.Image || item.type === MediaType.Photo || item.type === MediaType.Video
  )
}

/** What a gallery shows at all: the widget's `Thumbnail` draws nothing for any other type. */
function isShown(item: MediaItem): boolean {
  return isViewable(item) || item.type === MediaType.External || item.type === MediaType.PDF
}

/**
 * Adds a list's viewable items to the lightbox sequence and returns its gallery tiles, each
 * pointing at its own place in that sequence.
 */
function collect(items: MediaItem[], lightbox: LightboxMedia[]): GalleryTile[] {
  return items.filter(isShown).map((item) => {
    if (!isViewable(item)) return { kind: 'media', item, lightboxIndex: null }
    lightbox.push(toLightboxMedia(item))
    return { kind: 'media', item, lightboxIndex: lightbox.length - 1 }
  })
}

/**
 * Submitter HTML, sanitized. Plain-text submissions keep their line breaks: when there is no `<p`
 * in it, newlines become `<br>`, as the widget does. (The widget checked the whole record for a
 * `<p`, so one HTML field turned off the conversion for every other; it is decided per field here.)
 */
export function submitterHtml(text: string | null): string | null {
  if (!text) return null
  // Newlines to <br>, only for text with no paragraph markup.
  const withBreaks = text.includes('<p') ? text : text.replace(/\r?\n/g, '<br>')
  const html = sanitizeSubmittedHtml(withBreaks).trim()
  return html ? html : null
}

function byDateDescending(a: Avalanche, b: Avalanche): number {
  return (b.date ?? '').localeCompare(a.date ?? '')
}

export function prepareObservationDetail(observation: Observation): ObservationDetailData {
  const { summary, snowpackSummary, avalanches, ...rest } = observation
  const lightbox: LightboxMedia[] = []
  const gallery: GalleryTile[] = [
    ...collect(observation.media, lightbox),
    ...observation.urls.map((href): GalleryTile => ({ kind: 'link', href, title: href })),
  ]
  // Each avalanche's media joins the sequence (the widget renders their galleries hidden, so the
  // lightbox can page into them); the avalanches themselves are shown as cards.
  for (const avalanche of avalanches) collect(avalanche.media, lightbox)
  const snowpackGallery = collect(observation.snowpackMedia, lightbox)

  return {
    kind: 'observation',
    observation: rest,
    summaryHtml: submitterHtml(summary),
    snowpackHtml: submitterHtml(snowpackSummary),
    gallery,
    snowpackGallery,
    // Nested avalanches come back with no zone; the widget leaves their cards' zone blank
    // rather than calling them "Other".
    avalanches: [...avalanches]
      .sort(byDateDescending)
      .map((avalanche) => ({ ...avalancheCard(avalanche), zoneName: avalanche.zone.name })),
    lightbox,
  }
}

export function prepareAvalancheDetail(avalanche: Avalanche): AvalancheDetailData {
  const lightbox: LightboxMedia[] = []
  const gallery = collect(avalanche.media, lightbox)
  if (avalanche.attachmentUrl) {
    gallery.push({
      kind: 'link',
      href: avalanche.attachmentUrl,
      title: avalanche.attachmentDescription ?? avalanche.attachmentUrl,
    })
  }
  return { kind: 'avalanche', avalanche, gallery, lightbox }
}
