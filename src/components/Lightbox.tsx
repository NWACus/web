'use client'

import { ChevronLeft, ChevronRight, RotateCcw, X, ZoomIn, ZoomOut } from 'lucide-react'
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { type ReactZoomPanPinchRef } from 'react-zoom-pan-pinch'

import { type CarouselApi } from '@/components/ui/carousel'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog'

/**
 * The full-viewport chrome every lightbox in the site shares: a black field edge to edge, a slide
 * counter, zoom controls, edge arrows, and a close button.
 *
 * This is the shape the legacy NAC widgets use, and viewers generally (PhotoSwipe, Lightbox2): the
 * media gets the whole screen, and the chrome floats over it. Callers own the carousel and the
 * slides — the shell only frames them — so the Gallery block can keep rendering Payload `Media`
 * documents while a forecast renders remote URLs.
 */
type LightboxProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Accessible name for the dialog. */
  title: string
  /** Zero-based index of the slide on screen. */
  index: number
  count: number
  onPrev: () => void
  onNext: () => void
  /**
   * The active slide's zoom surface. Zoom controls render only when this is given, so a slide that
   * can't zoom — a video, an outbound link — doesn't advertise buttons that do nothing.
   */
  zoomRef?: React.RefObject<ReactZoomPanPinchRef | null>
  children: ReactNode
}

export function Lightbox({
  open,
  onOpenChange,
  title,
  index,
  count,
  onPrev,
  onNext,
  zoomRef,
  children,
}: LightboxProps) {
  const multiple = count > 1
  const contentRef = useRef<HTMLDivElement>(null)
  useArrowKeyNavigation(open && multiple, onPrev, onNext)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        ref={contentRef}
        hideClose
        onOpenAutoFocus={(event) => {
          // Radix focuses the first tabbable child on open, which lands on the zoom-in button and
          // paints a focus ring on a control nobody touched. Focus the dialog itself instead — it
          // carries `tabIndex={-1}`, so the focus trap, Escape, and Tab all still behave, and the
          // first ring the user sees is one they caused.
          event.preventDefault()
          contentRef.current?.focus()
        }}
        // `focus:outline-none`: the dialog is only ever focused as a landing spot, never tabbed to,
        // so it shouldn't draw a ring around the whole screen. The controls keep their own.
        className="h-[100dvh] w-screen max-w-none border-0 bg-transparent p-0 shadow-none focus:outline-none sm:rounded-none"
        overlayClassName="bg-black/95"
      >
        <DialogTitle className="sr-only">{title}</DialogTitle>
        <DialogDescription className="sr-only">
          Viewing item {index + 1} of {count}. Use the arrow keys to move between items.
        </DialogDescription>

        {children}

        <TopBar index={index} count={count} zoomRef={zoomRef} />
        <EdgeArrows show={multiple} onPrev={onPrev} onNext={onNext} />
      </DialogContent>
    </Dialog>
  )
}

/**
 * One slide's layout: the media centered in whatever height the chrome leaves it, with its caption
 * beneath. The caption belongs to the slide rather than to the shell so it travels with the media
 * as the carousel moves, instead of swapping under a still image mid-scroll.
 */
export function LightboxSlide({ caption, children }: { caption?: ReactNode; children: ReactNode }) {
  return (
    <div className="flex h-[100dvh] flex-col px-4 pb-5 pt-14 sm:px-20">
      <div className="relative flex min-h-0 flex-1 items-center justify-center">{children}</div>
      {caption && (
        <div className="mx-auto max-h-[20vh] w-full max-w-3xl shrink-0 overflow-y-auto pt-4 text-center text-sm text-white/80">
          {caption}
        </div>
      )}
    </div>
  )
}

/**
 * Carousel state for a lightbox: which slide is on screen, and how to move between them.
 *
 * The index is tracked here rather than read from the carousel on demand because the shell needs it
 * to render (the counter, and whether the active slide can zoom). It is also set when the lightbox
 * opens, before the carousel's first `select` fires, so the chrome is right on the first frame.
 */
export function useLightboxCarousel(startIndex: number, open: boolean) {
  const [api, setApi] = useState<CarouselApi>()
  const [index, setIndex] = useState(startIndex)

  useEffect(() => {
    if (open) setIndex(startIndex)
  }, [open, startIndex])

  useEffect(() => {
    if (!api) return
    // Jump without animating: this is the slide the user asked to open, not one they scrolled to.
    api.scrollTo(startIndex, true)
    setIndex(api.selectedScrollSnap())

    const onSelect = () => setIndex(api.selectedScrollSnap())
    api.on('select', onSelect)
    return () => {
      api.off('select', onSelect)
    }
  }, [api, startIndex])

  const scrollPrev = useCallback(() => api?.scrollPrev(), [api])
  const scrollNext = useCallback(() => api?.scrollNext(), [api])

  return { setApi, index, scrollPrev, scrollNext }
}

/**
 * Arrow keys navigate from anywhere on the page while the lightbox is open.
 *
 * The listener is on the window rather than on the carousel because Radix focuses the dialog
 * container, not the carousel inside it, so the carousel's own key handler would never see them.
 * Capture + `stopPropagation` keeps that handler from also firing once focus does land inside the
 * carousel, which would advance two slides at a time.
 */
function useArrowKeyNavigation(active: boolean, onPrev: () => void, onNext: () => void) {
  useEffect(() => {
    if (!active) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        e.stopPropagation()
        onPrev()
      } else if (e.key === 'ArrowRight') {
        e.stopPropagation()
        onNext()
      }
    }
    window.addEventListener('keydown', onKeyDown, true)
    return () => window.removeEventListener('keydown', onKeyDown, true)
  }, [active, onPrev, onNext])
}

const chromeButtonClass =
  'flex h-9 w-9 items-center justify-center rounded-full text-white/80 transition hover:bg-white/20 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60'

/** The counter down one corner and the controls down the other, floating over the media. */
function TopBar({
  index,
  count,
  zoomRef,
}: {
  index: number
  count: number
  zoomRef?: React.RefObject<ReactZoomPanPinchRef | null>
}) {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-[70] flex items-start justify-between p-3">
      {count > 1 ? (
        <span className="rounded-full bg-black/40 px-3 py-1 text-sm tabular-nums text-white/80 backdrop-blur">
          {index + 1} / {count}
        </span>
      ) : (
        <span />
      )}
      <div className="pointer-events-auto flex items-center gap-1 rounded-full bg-black/40 p-1 backdrop-blur">
        {zoomRef && <ZoomControls zoomRef={zoomRef} />}
        <DialogClose className={chromeButtonClass} aria-label="Close">
          <X className="h-5 w-5" />
        </DialogClose>
      </div>
    </div>
  )
}

function ZoomControls({ zoomRef }: { zoomRef: React.RefObject<ReactZoomPanPinchRef | null> }) {
  return (
    <>
      <button
        type="button"
        onClick={() => zoomRef.current?.zoomIn()}
        aria-label="Zoom in"
        className={chromeButtonClass}
      >
        <ZoomIn className="h-5 w-5" />
      </button>
      <button
        type="button"
        onClick={() => zoomRef.current?.zoomOut()}
        aria-label="Zoom out"
        className={chromeButtonClass}
      >
        <ZoomOut className="h-5 w-5" />
      </button>
      <button
        type="button"
        onClick={() => zoomRef.current?.resetTransform()}
        aria-label="Reset zoom"
        className={chromeButtonClass}
      >
        <RotateCcw className="h-5 w-5" />
      </button>
    </>
  )
}

function EdgeArrows({
  show,
  onPrev,
  onNext,
}: {
  show: boolean
  onPrev: () => void
  onNext: () => void
}) {
  if (!show) return null

  return (
    <>
      <EdgeArrow direction="prev" onClick={onPrev} />
      <EdgeArrow direction="next" onClick={onNext} />
    </>
  )
}

/**
 * A full-height strip down one edge of the screen, so the whole margin beside the media advances
 * the carousel rather than just the glyph.
 */
function EdgeArrow({ direction, onClick }: { direction: 'prev' | 'next'; onClick: () => void }) {
  const isPrev = direction === 'prev'
  const Icon = isPrev ? ChevronLeft : ChevronRight

  return (
    <button
      type="button"
      onClick={(e) => {
        // Blur on mouse click (detail > 0) to drop the lingering focus ring; keep focus on
        // keyboard activation (detail === 0).
        if (e.detail > 0) e.currentTarget.blur()
        onClick()
      }}
      aria-label={isPrev ? 'Previous' : 'Next'}
      className={`group absolute inset-y-0 z-[60] flex w-[10vw] min-w-14 items-center focus:outline-none ${
        isPrev ? 'left-0 justify-start pl-2 sm:pl-4' : 'right-0 justify-end pr-2 sm:pr-4'
      }`}
    >
      <span className="flex h-11 w-11 items-center justify-center rounded-md bg-white/10 text-white opacity-70 backdrop-blur transition group-hover:bg-white/20 group-hover:opacity-100 group-focus-visible:ring-2 group-focus-visible:ring-white/60">
        <Icon className="h-6 w-6" />
      </span>
    </button>
  )
}
