'use client'

import { Lightbox, LightboxSlide, useLightboxCarousel } from '@/components/Lightbox'
import { ImageMedia } from '@/components/Media/ImageMedia'
import { VideoMedia } from '@/components/Media/VideoMedia'
import { Carousel, CarouselContent, CarouselItem } from '@/components/ui/carousel'
import {
  getVideoEmbedUrl,
  getVideoThumbnail,
  parseVideoUrl,
  videoProviderLabels,
  type ParsedVideo,
} from '@/utilities/videoEmbed'
import { useRef } from 'react'
import { type ReactZoomPanPinchRef } from 'react-zoom-pan-pinch'
import { ZoomableImage } from './ZoomableImage'
import { isVideoResource, type GalleryItem } from './shared'

type Props = {
  items: GalleryItem[]
  open: boolean
  onOpenChange: (open: boolean) => void
  startIndex: number
}

export const GalleryLightbox = ({ items, open, onOpenChange, startIndex }: Props) => {
  const {
    setApi,
    index: selectedIndex,
    scrollPrev,
    scrollNext,
  } = useLightboxCarousel(startIndex, open)
  const transformRef = useRef<ReactZoomPanPinchRef>(null)

  const activeItem = items[selectedIndex]
  const activeIsImage = activeItem?.type === 'upload' && !isVideoResource(activeItem.media)

  return (
    <Lightbox
      open={open}
      onOpenChange={onOpenChange}
      title="Gallery"
      index={selectedIndex}
      count={items.length}
      onPrev={scrollPrev}
      onNext={scrollNext}
      zoomRef={activeIsImage ? transformRef : undefined}
    >
      {open && (
        <Carousel opts={{ startIndex, loop: items.length > 1, watchDrag: false }} setApi={setApi}>
          <CarouselContent>
            {items.map((item, index) => (
              <CarouselItem key={item.id ?? index}>
                <LightboxSlide
                  caption={item.caption ? <p className="text-white">{item.caption}</p> : undefined}
                >
                  <Slide
                    item={item}
                    isActive={index === selectedIndex}
                    transformRef={transformRef}
                  />
                </LightboxSlide>
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
      )}
    </Lightbox>
  )
}

function Slide({
  item,
  isActive,
  transformRef,
}: {
  item: GalleryItem
  isActive: boolean
  transformRef: React.Ref<ReactZoomPanPinchRef>
}) {
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
    return <EmbeddedVideoSlide video={video} title={item.videoTitle} isActive={isActive} />
  }

  if (isVideoResource(item.media)) {
    return (
      <VideoMedia
        resource={item.media}
        showVideoControls
        videoClassName="max-h-full w-auto max-w-full"
      />
    )
  }

  // Only the active image is zoomable; remounting it on navigation resets zoom.
  if (isActive) {
    return <ZoomableImage resource={item.media} transformRef={transformRef} />
  }
  return (
    <div className="relative h-full w-full">
      <ImageMedia resource={item.media} fill imgClassName="object-contain" />
    </div>
  )
}

/** A third-party video (YouTube, Vimeo); off-screen slides show a still so nothing else loads. */
function EmbeddedVideoSlide({
  video,
  title,
  isActive,
}: {
  video: ParsedVideo
  title?: string | null
  isActive: boolean
}) {
  if (isActive) {
    return (
      <iframe
        className="aspect-video max-h-full w-full max-w-5xl"
        src={getVideoEmbedUrl(video, true)}
        title={title || `${videoProviderLabels[video.provider]} video`}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
      />
    )
  }

  const thumbnail = getVideoThumbnail(video)
  if (thumbnail) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={thumbnail} alt={title || ''} className="max-h-full max-w-full object-contain" />
    )
  }

  return (
    <div className="flex flex-col items-center justify-center gap-1 text-center text-white">
      <span className="text-xs font-medium uppercase tracking-wide text-white/70">
        {videoProviderLabels[video.provider]}
      </span>
      {title && <span className="text-sm">{title}</span>}
    </div>
  )
}
