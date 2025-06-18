'use client'

import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { cssVariables } from '@/cssVariables'
import { getMediaURL } from '@/utilities/getURL'
import { cn } from '@/utilities/ui'
import NextImage, { StaticImageData } from 'next/image'
import { forwardRef, useState } from 'react'
import type { Props as MediaProps } from '../types'

const { breakpoints } = cssVariables

interface MediaAvatarImageProps extends Omit<MediaProps, 'src'> {
  className?: string
  onError?: () => void
  src?: StaticImageData | string
}

export const MediaAvatarImage = forwardRef<HTMLImageElement, MediaAvatarImageProps>(
  (
    {
      resource,
      src: srcFromProps,
      alt: altFromProps,
      size: sizeFromProps,
      priority,
      loading: loadingFromProps,
      className,
      onError,
      ...props
    },
    ref,
  ) => {
    let alt = altFromProps || ''
    let src: StaticImageData | string = srcFromProps || ''
    let blurDataURL: string | null | undefined

    if (!src && resource && typeof resource === 'object') {
      const { alt: altFromResource, url, blurDataUrl: blurDataURLFromResource } = resource

      alt = altFromResource || ''
      blurDataURL = blurDataURLFromResource

      const cacheTag = resource.updatedAt
      src = getMediaURL(url, cacheTag)
    }

    const loading = loadingFromProps || (!priority ? 'lazy' : undefined)

    const sizes = sizeFromProps
      ? sizeFromProps
      : Object.entries(breakpoints)
          .map(([, value]) => `(max-width: ${value}px) ${value}px`)
          .join(', ')

    return (
      <NextImage
        ref={ref}
        src={src}
        alt={alt}
        fill
        className={cn('h-full w-full object-cover', className)}
        placeholder={blurDataURL ? 'blur' : 'empty'}
        blurDataURL={blurDataURL || undefined}
        priority={priority}
        quality={100}
        loading={loading}
        sizes={sizes}
        onError={onError}
        {...props}
      />
    )
  },
)
MediaAvatarImage.displayName = 'MediaAvatarImage'

interface MediaAvatarProps {
  resource?: MediaProps['resource']
  src?: string
  alt?: string
  size?: string
  priority?: boolean
  loading?: 'lazy' | 'eager'

  // Avatar-specific props
  fallback?: React.ReactNode
  fallbackClassName?: string
  imageClassName?: string

  // shadcn Avatar props
  className?: string
  asChild?: boolean
}

export const MediaAvatar = ({
  resource,
  src,
  alt,
  size,
  priority,
  loading,
  fallback,
  fallbackClassName,
  imageClassName,
  className,
  asChild,
  ...avatarProps
}: MediaAvatarProps) => {
  const [imageError, setImageError] = useState(false)

  let blurDataURL: string | null | undefined
  if (resource && typeof resource === 'object') {
    blurDataURL = resource.blurDataUrl
  }

  const handleError = () => {
    setImageError(true)
  }

  return (
    <Avatar className={cn(className)} asChild={asChild} {...avatarProps}>
      {/* Show blur data URL when image fails to load and blur data is available */}
      {imageError && blurDataURL ? (
        <MediaAvatarImage
          src={blurDataURL}
          alt={alt || ''}
          className={cn('opacity-50', imageClassName)}
          priority={true} // Load error state immediately
        />
      ) : (
        <MediaAvatarImage
          resource={resource}
          src={src}
          alt={alt}
          size={size}
          priority={priority}
          loading={loading}
          className={imageClassName}
          onError={handleError}
        />
      )}

      {fallback && <AvatarFallback className={fallbackClassName}>{fallback}</AvatarFallback>}
    </Avatar>
  )
}
