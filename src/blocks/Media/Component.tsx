import type { StaticImageData } from 'next/image'

import RichText from '@/components/RichText'
import { cn } from '@/utilities/ui'

import type { MediaBlock as MediaBlockProps } from '@/payload-types'

import { Media } from '@/components/Media'
import getTextColorFromBgColor from '@/utilities/getTextColorFromBgColor'
import {
  buildImageSizes,
  type ContainerSizes,
  FULL_WIDTH_CONTAINER,
  IMAGE_SIZE_SPECS,
} from '@/utilities/mediaSizes'

type Props = MediaBlockProps & {
  isLayoutBlock: boolean
  captionClassName?: string
  className?: string
  imgClassName?: string
  staticImage?: StaticImageData
  // Column context from a multi-column layout, so `sizes` matches the real container width.
  containerSizes?: ContainerSizes
}

export const MediaBlockComponent = (props: Props) => {
  const {
    caption,
    captionClassName,
    className,
    isLayoutBlock = true,
    imgClassName,
    media,
    staticImage,
    alignContent = 'left',
    backgroundColor,
    imageSize = 'original',
    containerSizes,
  } = props

  const bgColorClass = `bg-${backgroundColor}`
  const textColor = getTextColorFromBgColor(backgroundColor)

  // `cqw` sizes the image relative to the block's `@container`. Keep in sync with IMAGE_SIZE_SPECS.
  const getImageSizeClasses = () => {
    switch (imageSize) {
      case 'small':
        return 'max-w-[max(16rem,50cqw)]'
      case 'medium':
        return 'max-w-[max(20rem,75cqw)]'
      case 'large':
        return 'max-w-[max(24rem,90cqw)]'
      case 'full':
        return 'max-w-full'
      case 'original':
      default:
        return 'max-w-fit'
    }
  }

  const getSizesForImageSize = () => {
    const spec = IMAGE_SIZE_SPECS[imageSize ?? 'original']
    if (!spec) return '100vw'
    return buildImageSizes(containerSizes ?? FULL_WIDTH_CONTAINER, spec)
  }

  return (
    <div className={cn(bgColorClass, textColor)}>
      <div
        className={cn(
          isLayoutBlock && 'container py-10',
          '@container',
          'flex flex-col',
          alignContent === 'left' && 'items-start',
          alignContent === 'center' && 'items-center',
          alignContent === 'right' && 'items-end',
          className,
        )}
      >
        {(media || staticImage) && (
          <div
            className={cn(
              getImageSizeClasses(),
              imageSize !== 'original' && imageSize != null && 'w-full',
              'flex flex-col gap-2',
            )}
          >
            <Media
              className="my-0"
              imgClassName={cn(
                'mx-auto',
                imageSize !== 'original' && imageSize != null && 'w-full',
                imgClassName,
              )}
              resource={media}
              src={staticImage}
              sizes={getSizesForImageSize()}
            />
            {caption && (
              <div className={captionClassName}>
                <RichText data={caption} enableGutter={false} className="text-xs" />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
