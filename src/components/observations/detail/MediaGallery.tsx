'use client'

/**
 * A record's media as the widget's gallery shows it: photos and videos open the lightbox, which
 * pages through every photo and video on the record; PDFs, external media and linked URLs open in
 * a new tab. Captions arrive sanitized from the server (`prepareDetail`).
 */
import { ExternalLink, FileText, Link2, Maximize2, PlayCircle } from 'lucide-react'
import { useState } from 'react'

import { MediaLightbox } from '@/components/forecast/MediaLightbox'
import type { LightboxMedia } from '@/components/forecast/lightboxMedia'
import { getThumbnailUrl } from '@/components/forecast/mediaItem'
import { MediaType, type MediaItem } from '@/services/nac/model/forecast'

import type { GalleryTile } from './detailTypes'

const TILE =
  'group relative flex aspect-[4/3] w-full flex-col items-center justify-center gap-1 overflow-hidden rounded-md border bg-muted p-2 text-center text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'

function linkOf(item: MediaItem): string | null {
  if (item.type === MediaType.External) return item.url.external_link
  return item.type === MediaType.PDF ? item.url.original : null
}

function titleOf(item: MediaItem): string {
  const title = 'title' in item ? item.title : null
  if (title) return title
  return item.type === MediaType.PDF ? 'PDF' : 'External media'
}

function LinkTile({ href, title, pdf }: { href: string; title: string; pdf?: boolean }) {
  const Icon = pdf ? FileText : Link2
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={TILE}>
      <Icon className="h-6 w-6 text-muted-foreground" aria-hidden="true" />
      <span className="line-clamp-2 break-all">{title}</span>
      <ExternalLink className="absolute right-1 top-1 h-3 w-3" aria-hidden="true" />
      <span className="sr-only">(opens in a new tab)</span>
    </a>
  )
}

function ViewTile({
  item,
  index,
  count,
  onOpen,
}: {
  item: MediaItem
  index: number
  count: number
  onOpen: () => void
}) {
  const thumbnail = getThumbnailUrl(item)
  return (
    <button
      type="button"
      onClick={onOpen}
      className={TILE}
      aria-label={`Open media ${index + 1} of ${count}`}
    >
      {thumbnail && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={thumbnail}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
          loading="lazy"
        />
      )}
      {item.type === MediaType.Video && (
        <PlayCircle className="relative h-8 w-8 text-red-600 drop-shadow" aria-hidden="true" />
      )}
      <Maximize2
        className="absolute right-1 top-1 h-3 w-3 text-white drop-shadow"
        aria-hidden="true"
      />
    </button>
  )
}

function Tile({
  tile,
  count,
  onOpen,
}: {
  tile: GalleryTile
  count: number
  onOpen: (index: number) => void
}) {
  if (tile.kind === 'link') return <LinkTile href={tile.href} title={tile.title} />
  if (tile.lightboxIndex !== null) {
    const index = tile.lightboxIndex
    return <ViewTile item={tile.item} index={index} count={count} onOpen={() => onOpen(index)} />
  }
  const href = linkOf(tile.item)
  if (!href) return null
  return <LinkTile href={href} title={titleOf(tile.item)} pdf={tile.item.type === MediaType.PDF} />
}

export function MediaGallery({
  tiles,
  lightbox,
}: {
  tiles: GalleryTile[]
  lightbox: LightboxMedia[]
}) {
  const [open, setOpen] = useState(false)
  const [index, setIndex] = useState(0)
  if (tiles.length === 0) return null
  return (
    <>
      <ul className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
        {tiles.map((tile, position) => (
          <li key={position}>
            <Tile
              tile={tile}
              count={lightbox.length}
              onOpen={(next) => {
                setIndex(next)
                setOpen(true)
              }}
            />
          </li>
        ))}
      </ul>
      <MediaLightbox media={lightbox} initialIndex={index} open={open} onOpenChange={setOpen} />
    </>
  )
}
