'use client'

import { ImageMedia } from '@/components/Media/ImageMedia'
import { VideoMedia } from '@/components/Media/VideoMedia'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from '@/components/ui/carousel'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import type { Gallery, GalleryBlock } from '@/payload-types'
import { cn } from '@/utilities/ui'
import {
  getVideoEmbedUrl,
  getVideoThumbnail,
  parseVideoUrl,
  videoProviderLabels,
} from '@/utilities/videoEmbed'
import { Play } from 'lucide-react'
import { useEffect, useState } from 'react'

type GalleryItem = NonNullable<Gallery['items']>[number]

type Props = {
  items: GalleryItem[]
  layout: NonNullable<GalleryBlock['layout']>
  columns: NonNullable<GalleryBlock['columns']>
}

const gridColsClass: Record<string, string> = {
  '2': 'grid grid-cols-1 sm:grid-cols-2',
  '3': 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
  '4': 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4',
}

const masonryColsClass: Record<string, string> = {
  '2': 'columns-1 sm:columns-2',
  '3': 'columns-1 sm:columns-2 lg:columns-3',
  '4': 'columns-1 sm:columns-2 md:columns-3 lg:columns-4',
}

const thumbSizes: Record<string, string> = {
  '2': '(max-width: 640px) 100vw, 50vw',
  '3': '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw',
  '4': '(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw',
}

const isVideoResource = (media: GalleryItem['media']): media is Exclude<typeof media, number> =>
  typeof media === 'object' && media !== null && !!media.mimeType?.includes('video')

const PlayOverlay = () => (
  <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
    <span className="flex h-14 w-14 items-center justify-center rounded-full bg-black/60 transition group-hover:bg-black/80">
      <Play className="h-7 w-7 fill-white text-white" />
    </span>
  </div>
)

export const GalleryGrid = ({ items, layout, columns }: Props) => {
  const [open, setOpen] = useState(false)
  const [openIndex, setOpenIndex] = useState(0)
  const [api, setApi] = useState<CarouselApi>()
  const [selectedIndex, setSelectedIndex] = useState(0)

  useEffect(() => {
    if (!api) return
    setSelectedIndex(api.selectedScrollSnap())
    const onSelect = () => setSelectedIndex(api.selectedScrollSnap())
    api.on('select', onSelect)
    return () => {
      api.off('select', onSelect)
    }
  }, [api])

  const openAt = (index: number) => {
    setOpenIndex(index)
    setOpen(true)
  }

  const isMasonry = layout === 'masonry'
  const containerClass = isMasonry
    ? cn(masonryColsClass[columns], 'gap-3 [&>*]:mb-3 [&>*]:break-inside-avoid')
    : cn(gridColsClass[columns], 'gap-3')

  const renderThumbnail = (item: GalleryItem) => {
    if (item.type === 'video') {
      const video = parseVideoUrl(item.videoUrl)
      if (!video) {
        return (
          <div className="flex aspect-video w-full items-center justify-center bg-muted p-4 text-center text-sm text-muted-foreground">
            {item.videoTitle || 'Video unavailable'}
          </div>
        )
      }
      const thumbnail = getVideoThumbnail(video)
      // YouTube exposes a static thumbnail; Vimeo/TikTok don't, so show a
      // branded placeholder card with the title instead.
      return (
        <div className="relative aspect-video w-full overflow-hidden bg-black">
          {thumbnail ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={thumbnail}
              alt={item.videoTitle || ''}
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-300 ease-in-out group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center gap-1 p-4 text-center">
              <span className="text-xs font-medium uppercase tracking-wide text-white/70">
                {videoProviderLabels[video.provider]}
              </span>
              {item.videoTitle && (
                <span className="line-clamp-2 text-sm text-white">{item.videoTitle}</span>
              )}
            </div>
          )}
          <PlayOverlay />
        </div>
      )
    }

    if (isVideoResource(item.media)) {
      return (
        <div
          className={cn('relative w-full overflow-hidden bg-black', !isMasonry && 'aspect-square')}
        >
          <VideoMedia
            resource={item.media}
            showVideoControls={false}
            videoClassName={cn('w-full', isMasonry ? 'h-auto' : 'h-full object-cover')}
          />
          <PlayOverlay />
        </div>
      )
    }

    if (isMasonry) {
      return (
        <ImageMedia
          resource={item.media}
          pictureClassName="!my-0 block"
          imgClassName="w-full h-auto transition-transform duration-300 ease-in-out group-hover:scale-105"
          sizes={thumbSizes[columns]}
        />
      )
    }

    return (
      <div className="relative aspect-square w-full overflow-hidden">
        <ImageMedia
          resource={item.media}
          fill
          imgClassName="object-cover transition-transform duration-300 ease-in-out group-hover:scale-105"
          sizes={thumbSizes[columns]}
        />
      </div>
    )
  }

  const renderLightbox = (item: GalleryItem, index: number) => {
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
      // Only mount the iframe for the active slide so off-screen videos don't
      // autoplay or load; other slides show a placeholder until selected.
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

    return (
      <div className="relative h-[80vh] w-full">
        <ImageMedia resource={item.media} fill imgClassName="object-contain" />
      </div>
    )
  }

  return (
    <>
      <div className={containerClass}>
        {items.map((item, index) => (
          <button
            type="button"
            key={item.id ?? index}
            onClick={() => openAt(index)}
            className="group block w-full cursor-pointer overflow-hidden text-left"
            aria-label={item.caption || item.videoTitle || 'Open item'}
          >
            {renderThumbnail(item)}
          </button>
        ))}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          className="max-w-6xl w-[95vw] border-0 bg-transparent p-0 shadow-none"
          overlayClassName="bg-black/90"
        >
          <DialogTitle className="sr-only">Gallery</DialogTitle>
          {open && (
            <Carousel opts={{ startIndex: openIndex, loop: items.length > 1 }} setApi={setApi}>
              <CarouselContent>
                {items.map((item, index) => (
                  <CarouselItem key={item.id ?? index}>
                    <div className="flex flex-col items-center justify-center">
                      <div className="flex min-h-[60vh] w-full items-center justify-center">
                        {renderLightbox(item, index)}
                      </div>
                      {item.caption && (
                        <p className="mt-3 text-center text-sm text-white">{item.caption}</p>
                      )}
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              {items.length > 1 && (
                <>
                  <CarouselPrevious className="left-2 border-0 bg-white/80 hover:bg-white" />
                  <CarouselNext className="right-2 border-0 bg-white/80 hover:bg-white" />
                </>
              )}
            </Carousel>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
