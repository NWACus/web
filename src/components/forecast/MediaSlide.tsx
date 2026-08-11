import { type MediaItem } from '@/services/nac/model/forecast'

import { ZoomablePhoto } from './ZoomablePhoto'
import { resolveMediaSlide } from './mediaItem'

/** A single slide in the media lightbox. Which of the four shapes it takes is decided by
 * `resolveMediaSlide`, so this component only renders. */
export function MediaSlide({ item }: { item: MediaItem }) {
  const slide = resolveMediaSlide(item)

  switch (slide.kind) {
    case 'youtube':
      return (
        <div className="aspect-video w-full">
          <iframe
            src={`https://www.youtube.com/embed/${encodeURIComponent(slide.videoId)}`}
            className="h-full w-full rounded"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            title={slide.title}
          />
        </div>
      )
    case 'photo':
      return <ZoomablePhoto src={slide.url} alt={slide.alt} />
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
