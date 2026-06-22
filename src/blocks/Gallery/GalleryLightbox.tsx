'use client'

import { ImageMedia } from '@/components/Media/ImageMedia'
import { VideoMedia } from '@/components/Media/VideoMedia'
import { Button } from '@/components/ui/button'
import { Carousel, CarouselContent, CarouselItem, type CarouselApi } from '@/components/ui/carousel'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import {
  getVideoEmbedUrl,
  getVideoThumbnail,
  parseVideoUrl,
  videoProviderLabels,
} from '@/utilities/videoEmbed'
import { ChevronLeft, ChevronRight, RotateCcw, ZoomIn, ZoomOut } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { type ReactZoomPanPinchRef } from 'react-zoom-pan-pinch'
import { ZoomableImage } from './ZoomableImage'
import { isVideoResource, type GalleryItem } from './shared'

type Props = {
  items: GalleryItem[]
  open: boolean
  onOpenChange: (open: boolean) => void
  startIndex: number
}

const zoomButtonClass = 'h-8 w-8 rounded-full text-white/80 hover:bg-white/20 hover:text-white'

export const GalleryLightbox = ({ items, open, onOpenChange, startIndex }: Props) => {
  const [api, setApi] = useState<CarouselApi>()
  const [selectedIndex, setSelectedIndex] = useState(startIndex)
  const transformRef = useRef<ReactZoomPanPinchRef>(null)

  // Mark the opened slide active before the carousel's first `select` fires, so
  // its zoom controls render immediately.
  useEffect(() => {
    if (open) setSelectedIndex(startIndex)
  }, [open, startIndex])

  useEffect(() => {
    if (!api) return
    setSelectedIndex(api.selectedScrollSnap())
    const onSelect = () => setSelectedIndex(api.selectedScrollSnap())
    api.on('select', onSelect)
    return () => {
      api.off('select', onSelect)
    }
  }, [api])

  // Drag-to-swipe is disabled (it conflicts with image pan), so arrow keys
  // navigate alongside the prev/next buttons.
  useEffect(() => {
    if (!open || !api) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') api.scrollPrev()
      else if (e.key === 'ArrowRight') api.scrollNext()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, api])

  const renderSlide = (item: GalleryItem, index: number) => {
    if (item.type === 'video') {
      const video = parseVideoUrl(item.videoUrl)
      if (!video) {
        return (
          <a
            href={item.videoUrl || '#'}
            target="_blank"
            rel="noopener noreferrer"
            className="text-white underline"
          >
            {item.videoTitle || 'Open video'}
          </a>
        )
      }
      // Mount the iframe only for the active slide so off-screen videos don't
      // autoplay or load.
      if (index === selectedIndex) {
        return (
          <iframe
            className="aspect-video w-full max-w-5xl"
            src={getVideoEmbedUrl(video, true)}
            title={item.videoTitle || `${videoProviderLabels[video.provider]} video`}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        )
      }
      const thumbnail = getVideoThumbnail(video)
      return thumbnail ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={thumbnail}
          alt={item.videoTitle || ''}
          className="max-h-full max-w-full object-contain"
        />
      ) : (
        <div className="flex flex-col items-center justify-center gap-1 text-center text-white">
          <span className="text-xs font-medium uppercase tracking-wide text-white/70">
            {videoProviderLabels[video.provider]}
          </span>
          {item.videoTitle && <span className="text-sm">{item.videoTitle}</span>}
        </div>
      )
    }

    if (isVideoResource(item.media)) {
      return (
        <VideoMedia
          resource={item.media}
          showVideoControls
          videoClassName="max-h-[80vh] w-auto max-w-full"
        />
      )
    }

    // Only the active image is zoomable; remounting it on navigation resets zoom.
    if (index === selectedIndex) {
      return <ZoomableImage resource={item.media} transformRef={transformRef} />
    }
    return (
      <div className="relative h-[85vh] w-full">
        <ImageMedia resource={item.media} fill imgClassName="object-contain" />
      </div>
    )
  }

  const activeItem = items[selectedIndex]
  const activeIsImage = activeItem?.type === 'upload' && !isVideoResource(activeItem.media)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="h-[100dvh] max-w-none w-screen border-0 bg-transparent p-0 shadow-none sm:rounded-none [&>button]:z-[70] [&>button]:text-white [&>button]:opacity-80 [&>button]:hover:opacity-100 [&>button>svg]:h-7 [&>button>svg]:w-7"
        overlayClassName="bg-black/90"
      >
        <DialogTitle className="sr-only">Gallery</DialogTitle>
        {open && activeIsImage && (
          <div className="absolute right-14 top-3 z-[70] flex items-center gap-1 rounded-full bg-black/40 p-1 backdrop-blur">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => transformRef.current?.zoomIn()}
              aria-label="Zoom in"
              className={zoomButtonClass}
            >
              <ZoomIn className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => transformRef.current?.zoomOut()}
              aria-label="Zoom out"
              className={zoomButtonClass}
            >
              <ZoomOut className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => transformRef.current?.resetTransform()}
              aria-label="Reset zoom"
              className={zoomButtonClass}
            >
              <RotateCcw className="h-5 w-5" />
            </Button>
          </div>
        )}
        {open && (
          <Carousel opts={{ startIndex, loop: items.length > 1, watchDrag: false }} setApi={setApi}>
            <CarouselContent>
              {items.map((item, index) => (
                <CarouselItem key={item.id ?? index}>
                  <div className="flex h-[100dvh] flex-col items-center justify-center gap-3">
                    <div className="flex w-full items-center justify-center">
                      {renderSlide(item, index)}
                    </div>
                    {item.caption && (
                      <p className="text-center text-sm text-white">{item.caption}</p>
                    )}
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            {items.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={() => api?.scrollPrev()}
                  aria-label="Previous"
                  className="group absolute inset-y-0 left-0 z-50 flex w-[12vw] min-w-16 items-center justify-start pl-4 text-white"
                >
                  <ChevronLeft className="h-9 w-9 opacity-70 transition group-hover:opacity-100" />
                </button>
                <button
                  type="button"
                  onClick={() => api?.scrollNext()}
                  aria-label="Next"
                  className="group absolute inset-y-0 right-0 z-50 flex w-[12vw] min-w-16 items-center justify-end pr-4 text-white"
                >
                  <ChevronRight className="h-9 w-9 opacity-70 transition group-hover:opacity-100" />
                </button>
              </>
            )}
          </Carousel>
        )}
      </DialogContent>
    </Dialog>
  )
}
