'use client'

import { memo, useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

import { MediaLightbox } from './MediaLightbox'
import { MediaOverlay } from './MediaOverlay'
import { collectEmbeddedMedia, type EmbeddedMedia } from './embeddedMedia'

/** Marks a figure with its position in the lightbox, so a delegated click can resolve the index. */
const MEDIA_INDEX_ATTR = 'data-embedded-media-index'

interface DiscussionBodyProps {
  /** Already-sanitized forecast HTML. Sanitizing stays on the server. */
  html: string
}

/**
 * Authored forecast HTML, with any media the forecaster embedded in it made openable.
 *
 * The HTML is rendered in one piece, exactly as it arrives, so server rendering and the no-JS
 * rendering are unchanged. After mount the embedded figures are found in the DOM and given the
 * legacy widget's affordances — an expand chip, and a play button on videos — and activating one
 * opens the shared lightbox at that figure. With nothing embedded this is a plain
 * `dangerouslySetInnerHTML` and costs nothing.
 */
export function DiscussionBody({ html }: DiscussionBodyProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const [media, setMedia] = useState<EmbeddedMedia[]>([])
  const [lightboxIndex, setLightboxIndex] = useState(0)
  const [lightboxOpen, setLightboxOpen] = useState(false)

  useEffect(() => {
    const root = rootRef.current
    if (!root) return

    // Forecast HTML is authored by hand and arrives from outside; a surprise in one figure must
    // not take the discussion down with it, so the prose still renders and just isn't interactive.
    let found: EmbeddedMedia[] = []
    try {
      found = collectEmbeddedMedia(root)
    } catch {
      return
    }

    found.forEach(({ figure, iconTarget }, index) => {
      figure.setAttribute(MEDIA_INDEX_ATTR, String(index))
      // The overlay is portaled into this container and positioned against it, which is where the
      // legacy widget drew its icons.
      iconTarget.classList.add('relative', 'cursor-zoom-in')
    })
    setMedia(found)
  }, [html])

  const openAt = useCallback((index: number) => {
    setLightboxIndex(index)
    setLightboxOpen(true)
  }, [])

  // Clicking anywhere on a figure opens it, as in the legacy widget — except on a link, which
  // should navigate instead.
  const handleClick = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      const { target } = event
      if (!(target instanceof Element) || target.closest('a')) return

      const figure = target.closest(`[${MEDIA_INDEX_ATTR}]`)
      if (!figure) return

      const index = Number(figure.getAttribute(MEDIA_INDEX_ATTR))
      if (Number.isInteger(index)) openAt(index)
    },
    [openAt],
  )

  return (
    <>
      {/* Delegation lives out here: the figures come from innerHTML, so there is nowhere inside to
          hang a handler, and keeping the handler off AuthoredHtml keeps that subtree from
          re-rendering. */}
      <div onClick={handleClick}>
        <AuthoredHtml html={html} containerRef={rootRef} />
      </div>

      {media.map((item, index) =>
        createPortal(
          <MediaOverlay isVideo={item.isVideo} onOpen={() => openAt(index)} />,
          item.iconTarget,
          String(index),
        ),
      )}

      <MediaLightbox
        media={media.map((entry) => entry.media)}
        initialIndex={lightboxIndex}
        open={lightboxOpen}
        onOpenChange={setLightboxOpen}
      />
    </>
  )
}

/**
 * The authored HTML, isolated behind `memo` so it is written to the DOM once per distinct string.
 *
 * React compares the `dangerouslySetInnerHTML` wrapper by identity, so re-rendering this element
 * for any reason — opening the lightbox, say — replaces the whole subtree, detaching the figures
 * that were collected from it and stranding their overlays in orphaned nodes. Keeping it out of the
 * parent's update path is what makes those DOM references safe to hold.
 */
const AuthoredHtml = memo(function AuthoredHtml({
  html,
  containerRef,
}: {
  html: string
  containerRef: React.RefObject<HTMLDivElement | null>
}) {
  return (
    <div
      ref={containerRef}
      className="prose prose-sm max-w-none dark:prose-invert"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
})
