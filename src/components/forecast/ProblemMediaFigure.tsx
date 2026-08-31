'use client'

import { useState } from 'react'

import { MediaLightbox } from './MediaLightbox'
import { MediaOverlay } from './MediaOverlay'
import type { LightboxMedia } from './lightboxMedia'

interface ProblemMediaFigureProps {
  /** The item and its already-sanitized caption HTML. Sanitizing stays on the server. */
  media: LightboxMedia
  /** The still to show inline — the image itself, or a video's poster frame. */
  posterSrc: string
  isVideo: boolean
}

/**
 * A problem's example media, floated beside the discussion and openable in the lightbox.
 *
 * The legacy widget renders this through its shared `Thumbnail`, which puts a red YouTube glyph
 * over a video and an expand icon on everything, and opens the product-wide lightbox on click. A
 * video used to render as nothing here, so a forecaster's clip attached to an avalanche problem
 * disappeared without a trace.
 */
export function ProblemMediaFigure({ media, posterSrc, isVideo }: ProblemMediaFigureProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <figure className="mb-3 md:float-right md:mb-2 md:ml-6 md:w-1/2 lg:w-1/3">
        {/* Clicking the image opens the lightbox, as in the legacy widget. The overlay's button is
            what carries the keyboard affordance and the accessible name. */}
        <div className="relative cursor-zoom-in" onClick={() => setOpen(true)}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={posterSrc} alt="" className="w-full rounded-md" />
          <MediaOverlay isVideo={isVideo} onOpen={() => setOpen(true)} />
        </div>
        {media.captionHtml && (
          <figcaption
            className="pt-2 text-center text-sm italic text-muted-foreground"
            dangerouslySetInnerHTML={{ __html: media.captionHtml }}
          />
        )}
      </figure>

      <MediaLightbox media={[media]} initialIndex={0} open={open} onOpenChange={setOpen} />
    </>
  )
}
