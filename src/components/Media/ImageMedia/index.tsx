'use client'

import type { StaticImageData } from 'next/image'

import { cn } from '@/utilities/ui'
import NextImage from 'next/image'

import type { Props as MediaProps } from '../types'

import { cssVariables } from '@/cssVariables'
import { getMediaUrl } from '@/utilities/getMediaUrl'

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

    width = fullWidth || 200
    height = fullHeight || 200
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

  return (
    <picture className={cn(pictureClassName)}>
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
      />
    </picture>
  )
}
