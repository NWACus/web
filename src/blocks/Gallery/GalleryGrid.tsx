'use client'

import { ImageMedia } from '@/components/Media/ImageMedia'
import { VideoMedia } from '@/components/Media/VideoMedia'
import type { GalleryBlock } from '@/payload-types'
import { cn } from '@/utilities/ui'
import { getVideoThumbnail, parseVideoUrl, videoProviderLabels } from '@/utilities/videoEmbed'
import { Play } from 'lucide-react'
import { useState } from 'react'
import { GalleryLightbox } from './GalleryLightbox'
import { isVideoResource, type GalleryItem } from './shared'

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
      // YouTube exposes a static thumbnail; Vimeo doesn't, so show a branded
      // placeholder card with the title instead.
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

      <GalleryLightbox items={items} open={open} onOpenChange={setOpen} startIndex={openIndex} />
    </>
  )
}
