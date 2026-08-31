import { type MediaItem } from '@/services/nac/model/forecast'
import { getVideoEmbedUrl } from '@/utilities/videoEmbed'
import { type ReactZoomPanPinchRef } from 'react-zoom-pan-pinch'

import { ZoomablePhoto } from './ZoomablePhoto'
import { getPosterUrl, resolveMediaSlide } from './mediaItem'

/** A single slide in the media lightbox. Which of the four shapes it takes is decided by
 * `resolveMediaSlide`, so this component only renders.
 *
 * Only the active slide mounts what is expensive or stateful — the video player and the zoom
 * surface. The carousel keeps every slide mounted, so without this an off-screen video would load
 * its player and the chrome's zoom buttons would have several surfaces to choose between. */
export function MediaSlide({
  item,
  isActive,
  transformRef,
}: {
  item: MediaItem
  isActive: boolean
  /** Handed to the active photo so the chrome's zoom buttons drive it. */
  transformRef?: React.Ref<ReactZoomPanPinchRef>
}) {
  const slide = resolveMediaSlide(item)

  switch (slide.kind) {
    case 'youtube':
      if (!isActive) return <PosterStill src={getPosterUrl(item)} alt={slide.title} />
      return (
        <div className="aspect-video max-h-full w-full max-w-5xl">
          <iframe
            // Built by the shared helper so a video embedded in the discussion frames the same way
            // inline and in the lightbox.
            src={getVideoEmbedUrl({ provider: 'youtube', id: encodeURIComponent(slide.videoId) })}
            className="h-full w-full rounded"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            title={slide.title}
          />
        </div>
      )
    case 'photo':
      // Remounting the zoom surface on navigation is what resets the zoom for the next slide.
      if (!isActive) return <PosterStill src={slide.url} alt={slide.alt} />
      return <ZoomablePhoto src={slide.url} alt={slide.alt} transformRef={transformRef} />
    case 'link':
      return (
        <a
          href={slide.href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-white/70 underline"
        >
          {slide.label}
        </a>
      )
    case 'unsupported':
      return <p className="text-sm text-white/50">Unsupported media type</p>
  }
}

/** What an off-screen slide shows in place of its player or zoom surface. */
function PosterStill({ src, alt }: { src: string | null; alt: string }) {
  if (!src) return null
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={alt} className="max-h-full max-w-full rounded object-contain" />
}
