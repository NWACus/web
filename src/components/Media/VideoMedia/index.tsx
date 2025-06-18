'use client'

import { cn } from '@/utilities/ui'
import { useEffect, useRef } from 'react'

import { getURL } from '@/utilities/getURL'
import type { Props as MediaProps } from '../types'

export const VideoMedia = (props: MediaProps) => {
  const { onClick, resource, videoClassName } = props

  const videoRef = useRef<HTMLVideoElement>(null)
  // const [showFallback] = useState<boolean>()

  useEffect(() => {
    const { current: video } = videoRef
    if (video) {
      video.addEventListener('suspend', () => {
        // setShowFallback(true);
        // console.warn('Video was suspended, rendering fallback image.')
      })
    }
  }, [])

  if (resource && typeof resource === 'object') {
    const { filename } = resource

    return (
      <video
        autoPlay
        className={cn(videoClassName)}
        controls={false}
        loop
        muted
        onClick={onClick}
        playsInline
        ref={videoRef}
      >
        <source src={`${getURL()}/media/${filename}`} />
      </video>
    )
  }

  return null
}
