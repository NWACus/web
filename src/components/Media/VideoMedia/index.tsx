'use client'

import { cn } from '@/utilities/ui'
import { useRef } from 'react'

import { useTenant } from '@/providers/TenantProvider'
import { getMediaURL } from '@/utilities/getURL'
import { getHostnameFromTenant } from '@/utilities/tenancy/getHostnameFromTenant'
import type { Props as MediaProps } from '../types'

export const VideoMedia = (props: MediaProps) => {
  const { onClick, resource, showVideoControls, videoClassName } = props
  const { tenant } = useTenant()
  const videoRef = useRef<HTMLVideoElement>(null)

  if (resource && typeof resource === 'object') {
    const { url } = resource
    const cacheTag = resource.updatedAt

    const src = getMediaURL(url, cacheTag, getHostnameFromTenant(tenant))

    return (
      <video
        className={cn(videoClassName)}
        controls={showVideoControls ?? true}
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
