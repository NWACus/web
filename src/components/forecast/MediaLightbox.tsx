'use client'

import { useRef } from 'react'
import { type ReactZoomPanPinchRef } from 'react-zoom-pan-pinch'

import { Lightbox, LightboxSlide, useLightboxCarousel } from '@/components/Lightbox'
import { Carousel, CarouselContent, CarouselItem } from '@/components/ui/carousel'

import { MediaSlide } from './MediaSlide'
import type { LightboxMedia } from './lightboxMedia'
import { resolveMediaSlide } from './mediaItem'

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

/**
 * A forecast product's media, viewed full-screen.
 *
 * The chrome — counter, zoom, edge arrows, close — comes from the shared `Lightbox` shell, so this
 * frames the same way as the Gallery block and as the legacy NAC widget it replaces. What is left
 * here is the part that is the forecast's own: slides built from remote AFP URLs rather than
 * Payload `Media` documents, and captions the server already sanitized.
 */
export function MediaLightbox({ media, initialIndex, open, onOpenChange }: MediaLightboxProps) {
  const { setApi, index, scrollPrev, scrollNext } = useLightboxCarousel(initialIndex, open)
  const transformRef = useRef<ReactZoomPanPinchRef>(null)

  const activeItem = media[index]?.item
  // Only a still photo mounts a zoom surface, so only a still photo should advertise zoom controls.
  const activeCanZoom = activeItem ? resolveMediaSlide(activeItem).kind === 'photo' : false

  if (media.length === 0) return null

  return (
    <Lightbox
      open={open}
      onOpenChange={onOpenChange}
      title="Media viewer"
      index={index}
      count={media.length}
      onPrev={scrollPrev}
      onNext={scrollNext}
      zoomRef={activeCanZoom ? transformRef : undefined}
    >
      {open && (
        <Carousel
          opts={{ startIndex: initialIndex, loop: media.length > 1, watchDrag: false }}
          setApi={setApi}
        >
          <CarouselContent>
            {media.map(({ item, captionHtml }, idx) => (
              <CarouselItem key={idx}>
                <LightboxSlide caption={captionHtml ? <Caption html={captionHtml} /> : undefined}>
                  <MediaSlide item={item} isActive={idx === index} transformRef={transformRef} />
                </LightboxSlide>
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
      )}
    </Lightbox>
  )
}

/** A caption may carry HTML tags (e.g. `<p>`, `&nbsp;`), sanitized on the server — see
 * `./lightboxMedia`. */
function Caption({ html }: { html: string }) {
  return (
    <div
      className="prose prose-sm prose-invert max-w-none text-white/80"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}
