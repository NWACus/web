'use client'

import { cn } from '@/utilities/ui'
import { useEffect, useRef } from 'react'

import { useTenant } from '@/providers/TenantProvider'
import { getMediaURL } from '@/utilities/getURL'
import { getHostnameFromTenant } from '@/utilities/tenancy/getHostnameFromTenant'
import type { Props as MediaProps } from '../types'

export const VideoMedia = (props: MediaProps) => {
  const { onClick, resource, showVideoControls, videoClassName } = props
  const { tenant } = useTenant()
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
    const { url } = resource
    const cacheTag = resource.updatedAt

    const src = getMediaURL(url, cacheTag, getHostnameFromTenant(tenant))

    return (
      <video
        autoPlay
        className={cn(videoClassName)}
        controls={showVideoControls || true}
        loop
        muted
        onClick={onClick}
        playsInline
        ref={videoRef}
      >
        <source src={src} />
      </video>
    )
  }

  return null
}
