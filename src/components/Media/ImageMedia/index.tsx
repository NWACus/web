'use client'

import type { StaticImageData } from 'next/image'

import { cn } from '@/utilities/ui'
import NextImage from 'next/image'

import type { Props as MediaProps } from '../types'

import { cssVariables } from '@/cssVariables'
import { getMediaUrl } from '@/utilities/getMediaUrl'
import { useState } from 'react'

const { breakpoints } = cssVariables

export const ImageMedia = (props: MediaProps) => {
  const {
    alt: altFromProps,
    fill,
    pictureClassName,
    imgClassName,
    priority,
    resource,
    size: sizeFromProps,
    src: srcFromProps,
    loading: loadingFromProps,
  } = props

  const [imageError, setImageError] = useState(false)

  let width: number | undefined
  let height: number | undefined
  let alt = altFromProps
  let src: StaticImageData | string = srcFromProps || ''
  let blurDataURL: string | null | undefined

  if (!src && resource && typeof resource === 'object') {
    const {
      alt: altFromResource,
      height: fullHeight,
      url,
      width: fullWidth,
      blurDataUrl: blurDataURLFromResource,
    } = resource

    // The fallback values are not expected to be used but Payload types
    // result in these values potentially being undefined
    width = fullWidth || 400
    height = fullHeight || 300
    alt = altFromResource || ''
    blurDataURL = blurDataURLFromResource

    const cacheTag = resource.updatedAt

    src = getMediaUrl(url, cacheTag)
  }

  const loading = loadingFromProps || (!priority ? 'lazy' : undefined)

  const sizes = sizeFromProps
    ? sizeFromProps
    : Object.entries(breakpoints)
        .map(([, value]) => `(max-width: ${value}px) ${value * 2}w`)
        .join(', ')

  const handleError = () => {
    setImageError(true)
  }

  // Show blur data URL when image fails to load and blur data is available
  if (imageError && blurDataURL) {
    return (
      <div className={cn('relative', pictureClassName)}>
        <picture className={cn(pictureClassName)}>
          <NextImage
            alt={alt || ''}
            className={cn(imgClassName)}
            fill={fill}
            height={!fill ? height : undefined}
            priority={priority}
            quality={100}
            loading={loading}
            sizes={sizes}
            src={blurDataURL}
            width={!fill ? width : undefined}
          />
        </picture>
        <div className="absolute bottom-1 left-1 bg-black/60 text-white text-xs px-2 py-1 rounded backdrop-blur-sm">
          Image unavailable
        </div>
      </div>
    )
  }

  return (
    <picture className={cn('my-2', pictureClassName)}>
      <NextImage
        alt={alt || ''}
        className={cn(imgClassName)}
        fill={fill}
        height={!fill ? height : undefined}
        placeholder={blurDataURL ? 'blur' : 'empty'}
        blurDataURL={blurDataURL || undefined}
        priority={priority}
        quality={100}
        loading={loading}
        sizes={sizes}
        src={src}
        width={!fill ? width : undefined}
        onError={handleError}
      />
    </picture>
  )
}
