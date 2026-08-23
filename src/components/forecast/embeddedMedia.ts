/**
 * Media a forecaster embedded inside authored forecast HTML.
 *
 * The AFP editors wrap an embedded photo or video in a `figure` whose class marks it as
 * lightbox-able, with the poster image inside and a `figcaption` alongside:
 *
 *     <figure class="image afp-photoswipe">
 *       <div class="afp-image-container"><img src="…-large.jpg" alt=""></div>
 *       <figcaption>…</figcaption>
 *     </figure>
 *
 * A video is the same shape with `afp-video-modal` on the figure, `afp-video-container` added to the
 * inner div, and the YouTube id on the image as `data-video-id`. The `nac-` class variants come from
 * the older WordPress theme editor; the legacy widget matches both, so we do too.
 *
 * Collection reads the rendered DOM rather than the HTML string on purpose. These figures are not
 * reliably top-level: one center wraps its whole discussion in a `div`, others float a figure inside
 * a wrapper, and the editor has been known to leave a figure inside another figure's `figcaption`.
 * A tree walk is indifferent to all of that; string splitting is not.
 */
import { MediaType, type MediaItem } from '@/services/nac/model/forecast'

const EMBEDDED_MEDIA_SELECTOR =
  '.afp-photoswipe, .nac-photoswipe, .afp-video-modal, .nac-video-modal'

export interface EmbeddedMedia {
  /** The `figure` itself — the whole thing is the click target, as in the legacy widget. */
  figure: HTMLElement
  /** The inner container the legacy widget hangs the expand/play affordance off. */
  iconTarget: HTMLElement
  item: MediaItem
  isVideo: boolean
}

/**
 * Every embedded media figure under `root`, in document order.
 *
 * The item is built the way the legacy widget builds it: the first image's `src` stands in for all
 * four url sizes, and the first `figcaption`'s inner HTML is the caption. A figure with no image has
 * nothing to open, so it is skipped and left to render as authored.
 */
export function collectEmbeddedMedia(root: HTMLElement): EmbeddedMedia[] {
  const collected: EmbeddedMedia[] = []

  for (const figure of root.querySelectorAll(EMBEDDED_MEDIA_SELECTOR)) {
    if (!(figure instanceof HTMLElement)) continue

    const image = figure.querySelector('img')
    const src = image?.getAttribute('src')
    if (!image || !src) continue

    const caption = figure.querySelector('figcaption')?.innerHTML ?? null
    const videoId = image.getAttribute('data-video-id')
    const container = figure.querySelector('.afp-image-container, .afp-video-container')

    collected.push({
      figure,
      iconTarget: container instanceof HTMLElement ? container : figure,
      item: mediaItem(src, caption, videoId),
      isVideo: !!videoId,
    })
  }

  return collected
}

function mediaItem(src: string, caption: string | null, videoId: string | null): MediaItem {
  const sizes = { large: src, medium: src, original: src, thumbnail: src }

  if (videoId) {
    return { type: MediaType.Video, url: { ...sizes, video_id: videoId }, caption }
  }
  return { type: MediaType.Image, url: sizes, caption }
}
