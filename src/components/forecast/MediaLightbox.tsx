'use client'

import { useCallback, useEffect, useState } from 'react'

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from '@/components/ui/carousel'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'

import { MediaSlide } from './MediaSlide'
import type { LightboxMedia } from './lightboxMedia'

interface MediaLightboxProps {
  /**
   * The slides, each carrying its caption as already-sanitized HTML.
   *
   * Sanitizing here would put `sanitize-html` in every reader's bundle, so this component renders
   * `captionHtml` and never touches `item.caption`. See `./lightboxMedia`.
   */
  media: LightboxMedia[]
  initialIndex: number
  open: boolean
  onOpenChange: (open: boolean) => void
}

/** Sync the carousel to `initialIndex`, and track the slide the user has scrolled to. */
function useCarouselIndex(initialIndex: number) {
  const [api, setApi] = useState<CarouselApi>()
  const [current, setCurrent] = useState(initialIndex)

  useEffect(() => {
    if (!api) return
    // Jump to the initial index when the lightbox opens or initialIndex changes
    api.scrollTo(initialIndex, true)
    setCurrent(initialIndex)
  }, [api, initialIndex])

  useEffect(() => {
    if (!api) return
    const onSelect = () => setCurrent(api.selectedScrollSnap())
    api.on('select', onSelect)
    return () => {
      api.off('select', onSelect)
    }
  }, [api])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault()
        api?.scrollPrev()
      } else if (e.key === 'ArrowRight') {
        e.preventDefault()
        api?.scrollNext()
      }
    },
    [api],
  )

  return { api, setApi, current, handleKeyDown }
}

export function MediaLightbox({ media, initialIndex, open, onOpenChange }: MediaLightboxProps) {
  const { setApi, current, handleKeyDown } = useCarouselIndex(initialIndex)

  if (media.length === 0) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-4xl border-none bg-black/95 p-0 sm:rounded-xl"
        overlayClassName="bg-black/90"
        closeClassName="text-white hover:text-white/80"
        onKeyDown={handleKeyDown}
      >
        <DialogTitle className="sr-only">Media viewer</DialogTitle>
        <DialogDescription className="sr-only">
          Viewing {current + 1} of {media.length} media items. Use arrow keys to navigate.
        </DialogDescription>

        <div className="relative px-14 py-8">
          <LightboxCarousel media={media} initialIndex={initialIndex} setApi={setApi} />
          <LightboxFooter media={media} current={current} />
        </div>
      </DialogContent>
    </Dialog>
  )
}

function LightboxCarousel({
  media,
  initialIndex,
  setApi,
}: {
  media: LightboxMedia[]
  initialIndex: number
  setApi: (api: CarouselApi) => void
}) {
  const multiple = media.length > 1

  return (
    <Carousel setApi={setApi} opts={{ startIndex: initialIndex, loop: multiple, watchDrag: false }}>
      <CarouselContent>
        {media.map(({ item }, idx) => (
          <CarouselItem key={idx}>
            <div className="flex flex-col items-center gap-3">
              <MediaSlide item={item} />
            </div>
          </CarouselItem>
        ))}
      </CarouselContent>

      {multiple && (
        <>
          <CarouselPrevious className="left-1 border-white/20 bg-white/10 text-white hover:bg-white/20" />
          <CarouselNext className="right-1 border-white/20 bg-white/10 text-white hover:bg-white/20" />
        </>
      )}
    </Carousel>
  )
}

function LightboxFooter({ media, current }: { media: LightboxMedia[]; current: number }) {
  const captionHtml = media[current]?.captionHtml

  return (
    <div className="mt-3 text-center">
      {/* Captions may contain HTML tags (e.g. <p>, &nbsp;), sanitized on the server. */}
      {captionHtml && (
        <div
          className="prose prose-sm prose-invert max-w-none text-white/80"
          dangerouslySetInnerHTML={{ __html: captionHtml }}
        />
      )}
      {media.length > 1 && (
        <p className="mt-1 text-xs text-white/50">
          {current + 1} / {media.length}
        </p>
      )}
    </div>
  )
}
