'use client'

import { ExternalLink, FileText, Link as LinkIcon } from 'lucide-react'
import { useState } from 'react'

import { MediaType } from '@/services/nac/model/forecast'
import { cn } from '@/utilities/ui'

import { MediaLightbox } from './MediaLightbox'
import { MediaOverlay } from './MediaOverlay'
import type { LightboxMedia } from './lightboxMedia'
import { getThumbnailUrl, mediaGridTiles, type MediaLink } from './mediaItem'

interface ForecastMediaThumbnailsProps {
  /**
   * The product's displayable media, captions already sanitized — see `toLightboxMediaList`.
   * Filtering and sanitizing both happen on the server so neither crosses into this bundle.
   */
  media: LightboxMedia[]
}

const tileClassName =
  'group relative aspect-[4/3] overflow-hidden rounded-md bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'

/**
 * The Media grid, as the widget lays it out: images, photos and videos open the lightbox, which
 * steps through those alone; PDFs and external links open in a new tab.
 */
export function ForecastMediaThumbnails({ media }: ForecastMediaThumbnailsProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(0)

  if (media.length === 0) return null

  const { tiles, lightbox } = mediaGridTiles(media)

  return (
    <>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        {tiles.map((tile, idx) =>
          tile.kind === 'link' ? (
            <MediaLinkTile key={idx} link={tile.link} />
          ) : (
            <LightboxTile
              key={idx}
              media={tile.media}
              label={`Open media ${tile.index + 1} of ${lightbox.length}`}
              onOpen={() => {
                setLightboxIndex(tile.index)
                setLightboxOpen(true)
              }}
            />
          ),
        )}
      </div>

      <MediaLightbox
        media={lightbox}
        initialIndex={lightboxIndex}
        open={lightboxOpen}
        onOpenChange={setLightboxOpen}
      />
    </>
  )
}

function LightboxTile({
  media: { item },
  label,
  onOpen,
}: {
  media: LightboxMedia
  label: string
  onOpen: () => void
}) {
  const thumbUrl = getThumbnailUrl(item)
  const isVideo = item.type === MediaType.Video

  return (
    // The only content is a decorative <img alt="">, so without the label the button has no
    // accessible name at all.
    <button type="button" aria-label={label} onClick={onOpen} className={tileClassName}>
      {thumbUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={thumbUrl}
          alt=""
          className="h-full w-full object-cover transition-transform group-hover:scale-105"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
          {isVideo ? 'Video' : item.type}
        </div>
      )}
      <MediaOverlay isVideo={isVideo} />
    </button>
  )
}

/** The widget's PDF or link tile: a type icon, the item's title, and an open-in-new mark. */
function MediaLinkTile({ link }: { link: MediaLink }) {
  const Icon = link.kind === 'pdf' ? FileText : LinkIcon

  return (
    <a
      href={link.href}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        tileClassName,
        'flex flex-col items-center justify-center gap-2 p-3 text-center text-sm',
      )}
    >
      <Icon aria-hidden className="h-8 w-8 shrink-0 text-muted-foreground" />
      <span className="line-clamp-3 break-words font-medium group-hover:underline">
        {link.title ?? (link.kind === 'pdf' ? 'PDF' : 'External link')}
      </span>
      <span className="sr-only">(opens in a new tab)</span>
      <ExternalLink
        aria-hidden
        className="absolute bottom-2 left-2 h-4 w-4 text-muted-foreground"
      />
    </a>
  )
}
