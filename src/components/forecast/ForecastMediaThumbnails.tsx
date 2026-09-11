'use client'

import { useState } from 'react'

import { MediaType } from '@/services/nac/model/forecast'

import { MediaLightbox } from './MediaLightbox'
import type { LightboxMedia } from './lightboxMedia'
import { getThumbnailUrl } from './mediaItem'

interface ForecastMediaThumbnailsProps {
  /**
   * The product's displayable media, captions already sanitized — see `toLightboxMediaList`.
   * Filtering and sanitizing both happen on the server so neither crosses into this bundle.
   */
  media: LightboxMedia[]
}

export function ForecastMediaThumbnails({ media }: ForecastMediaThumbnailsProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(0)

  if (media.length === 0) return null

  return (
    <>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
        {media.map(({ item }, idx) => {
          const thumbUrl = getThumbnailUrl(item)
          return (
            <button
              key={idx}
              type="button"
              // The only content is a decorative <img alt="">, so without this the button has no
              // accessible name at all.
              aria-label={`Open media ${idx + 1} of ${media.length}`}
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
        media={media}
        initialIndex={lightboxIndex}
        open={lightboxOpen}
        onOpenChange={setLightboxOpen}
      />
    </>
  )
}
