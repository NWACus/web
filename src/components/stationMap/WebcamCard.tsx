'use client'

/**
 * The info card for a webcam: the widget's `InfoWebcamContent`. A webcam carries one or more
 * images — a still, a YouTube stream, or a link out — and a multi-image webcam cycles through them
 * every three seconds while its card is showing.
 */
import { ExternalLink } from 'lucide-react'
import { useEffect, useState } from 'react'

import { Button } from '@/components/ui/button'
import type { StationMapWebcam, StationMapWebcamImage } from '@/services/snowobs/stationMap/model'
import { youtubeEmbedUrl } from '@/services/snowobs/stationMap/webcams'

const CYCLE_MS = 3000

interface ImageProps {
  image: StationMapWebcamImage
  title: string
}

function Still({ image, title }: ImageProps) {
  return (
    // Third-party camera hosts, uncontrolled and unlisted in the image optimizer's allowlist.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={image.source}
      alt={image.title || title}
      className="h-[180px] w-full object-contain"
      loading="lazy"
    />
  )
}

function LinkOut({ image }: ImageProps) {
  return (
    <div className="flex h-[180px] items-center justify-center">
      <Button asChild size="sm" variant="outline">
        <a href={image.source} target="_blank" rel="noopener noreferrer">
          {image.title || 'Open webcam'}
          <ExternalLink className="ml-1 h-3 w-3" aria-hidden="true" />
        </a>
      </Button>
    </div>
  )
}

/** A YouTube link that can't be turned into an embed falls back to a link out. */
function Stream({ image, title }: ImageProps) {
  const embed = youtubeEmbedUrl(image.source)
  if (!embed) return <LinkOut image={image} title={title} />
  return (
    <iframe
      src={embed}
      title={image.title || title}
      className="h-[180px] w-full"
      allow="autoplay; encrypted-media; picture-in-picture"
      allowFullScreen
    />
  )
}

function WebcamImage(props: ImageProps) {
  if (props.image.type === 'image') return <Still {...props} />
  if (props.image.type === 'youtube') return <Stream {...props} />
  return <LinkOut {...props} />
}

/** Which image is showing; cycles while the card is active and there is more than one. */
function useImageCycle(active: boolean, total: number, webcamId: number): number {
  const [current, setCurrent] = useState(0)
  useEffect(() => {
    setCurrent(0)
    if (!active || total <= 1) return
    const interval = window.setInterval(() => setCurrent((index) => (index + 1) % total), CYCLE_MS)
    return () => window.clearInterval(interval)
  }, [active, total, webcamId])
  return current
}

export function WebcamCard({ webcam, active }: { webcam: StationMapWebcam; active: boolean }) {
  const total = webcam.images.length
  const current = useImageCycle(active, total, webcam.id)
  const image = webcam.images[current]

  return (
    <article
      className="block w-full overflow-hidden rounded-md bg-white text-left text-sm text-neutral-900 shadow-md"
      data-testid="webcam-card"
    >
      <header className="border-b px-3 py-2">
        <h3 className="text-base font-bold leading-tight">{webcam.title}</h3>
        {image && (
          <div className="mt-0.5 flex items-center justify-between text-xs text-neutral-600">
            <span>{image.title}</span>
            {total > 1 && (
              <span>
                {current + 1} of {total}
              </span>
            )}
          </div>
        )}
      </header>
      <div className="p-2">
        {image ? (
          <WebcamImage image={image} title={webcam.title} />
        ) : (
          <p className="px-1 py-2 text-xs text-neutral-500">No image for this webcam.</p>
        )}
      </div>
    </article>
  )
}
