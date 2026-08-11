'use client'

import { useState } from 'react'

import { type MediaItem, MediaType } from '@/services/nac/model/forecast'

import { MediaLightbox } from './MediaLightbox'
import { displayableMedia, getThumbnailUrl } from './mediaItem'

interface ForecastMediaThumbnailsProps {
  media: MediaItem[]
}

export function ForecastMediaThumbnails({ media }: ForecastMediaThumbnailsProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(0)

  const items = displayableMedia(media)
  if (items.length === 0) return null

  return (
    <>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
        {items.map((item, idx) => {
          const thumbUrl = getThumbnailUrl(item)
          return (
            <button
              key={idx}
              type="button"
              onClick={() => {
                setLightboxIndex(idx)
                setLightboxOpen(true)
              }}
              className="group relative aspect-square overflow-hidden rounded-md bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {thumbUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={thumbUrl}
                  alt=""
                  className="h-full w-full object-cover transition-transform group-hover:scale-105"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
                  {item.type === MediaType.Video ? 'Video' : item.type}
                </div>
              )}
            </button>
          )
        })}
      </div>

      <MediaLightbox
        media={items}
        initialIndex={lightboxIndex}
        open={lightboxOpen}
        onOpenChange={setLightboxOpen}
      />
    </>
  )
}
