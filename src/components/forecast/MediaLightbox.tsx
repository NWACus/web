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
import { MediaType, type MediaItem } from '@/services/nac/types/forecastSchemas'

import { sanitizeHtml } from './sanitizeHtml'

interface MediaLightboxProps {
  media: MediaItem[]
  initialIndex: number
  open: boolean
  onOpenChange: (open: boolean) => void
}

function getThumbnailUrl(item: MediaItem): string | null {
  if (item.type === MediaType.Image) return item.url.thumbnail
  if (item.type === MediaType.Photo) return typeof item.url === 'string' ? item.url : null
  if (item.type === MediaType.Video) {
    if (typeof item.url === 'object' && 'thumbnail' in item.url) return item.url.thumbnail
    return null
  }
  return null
}

function getFullUrl(item: MediaItem): string | null {
  if (item.type === MediaType.Image) return item.url.original
  if (item.type === MediaType.Photo) return typeof item.url === 'string' ? item.url : null
  return null
}

/** Extract YouTube video_id from a Video media item */
function getYouTubeVideoId(item: MediaItem): string | null {
  if (item.type !== MediaType.Video) return null
  if (typeof item.url === 'object' && 'video_id' in item.url) return item.url.video_id
  return null
}

function getCaption(item: MediaItem): string | null {
  if ('caption' in item && item.caption) return item.caption
  return null
}

export function MediaLightbox({ media, initialIndex, open, onOpenChange }: MediaLightboxProps) {
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
          <Carousel setApi={setApi} opts={{ startIndex: initialIndex, loop: media.length > 1 }}>
            <CarouselContent>
              {media.map((item, idx) => (
                <CarouselItem key={idx}>
                  <div className="flex flex-col items-center gap-3">
                    <MediaSlide item={item} />
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>

            {media.length > 1 && (
              <>
                <CarouselPrevious className="left-1 border-white/20 bg-white/10 text-white hover:bg-white/20" />
                <CarouselNext className="right-1 border-white/20 bg-white/10 text-white hover:bg-white/20" />
              </>
            )}
          </Carousel>

          {/* Caption and counter */}
          <div className="mt-3 text-center">
            {/* Captions may contain HTML tags (e.g. <p>, &nbsp;) */}
            {getCaption(media[current]) && (
              <div
                className="prose prose-sm prose-invert max-w-none text-white/80"
                dangerouslySetInnerHTML={{ __html: sanitizeHtml(getCaption(media[current]) ?? '') }}
              />
            )}
            {media.length > 1 && (
              <p className="mt-1 text-xs text-white/50">
                {current + 1} / {media.length}
              </p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function MediaSlide({ item }: { item: MediaItem }) {
  const videoId = getYouTubeVideoId(item)
  if (videoId) {
    return (
      <div className="aspect-video w-full">
        <iframe
          src={`https://www.youtube.com/embed/${encodeURIComponent(videoId)}`}
          className="h-full w-full rounded"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          title={getCaption(item) ?? 'YouTube video'}
        />
      </div>
    )
  }

  const fullUrl = getFullUrl(item)
  if (fullUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={fullUrl}
        alt={getCaption(item) ?? ''}
        className="max-h-[70vh] rounded object-contain"
      />
    )
  }

  // Unsupported media type — show link fallback
  if (
    item.type === MediaType.External &&
    typeof item.url === 'object' &&
    'external_link' in item.url
  ) {
    return (
      <a
        href={item.url.external_link}
        target="_blank"
        rel="noopener noreferrer"
        className="text-sm text-white/70 underline"
      >
        Open external media
      </a>
    )
  }

  if (item.type === MediaType.PDF && typeof item.url === 'object' && 'original' in item.url) {
    return (
      <a
        href={item.url.original}
        target="_blank"
        rel="noopener noreferrer"
        className="text-sm text-white/70 underline"
      >
        Open PDF
      </a>
    )
  }

  return <p className="text-sm text-white/50">Unsupported media type</p>
}

export { getThumbnailUrl }
