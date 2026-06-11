import type { StaticImageData } from 'next/image'

import RichText from '@/components/RichText'
import { cn } from '@/utilities/ui'

import type { MediaBlock as MediaBlockProps } from '@/payload-types'

import { Media } from '@/components/Media'
import getTextColorFromBgColor from '@/utilities/getTextColorFromBgColor'

type Props = MediaBlockProps & {
  isLayoutBlock: boolean
  captionClassName?: string
  className?: string
  imgClassName?: string
  staticImage?: StaticImageData
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
  } = props

  const bgColorClass = `bg-${backgroundColor}`
  const textColor = getTextColorFromBgColor(backgroundColor)

  // Uses container query breakpoints (@sm, @md, @lg) so sizing responds to the
  // parent container width rather than the viewport. This ensures correct
  // behavior when the block is embedded in a narrower container (e.g. post layout).
  const getImageSizeClasses = () => {
    switch (imageSize) {
      case 'small':
        return 'max-w-xs @sm:max-w-sm @lg:max-w-md'
      case 'medium':
        return 'max-w-sm @sm:max-w-lg @lg:max-w-2xl'
      case 'large':
        return 'max-w-md @sm:max-w-2xl @lg:max-w-4xl'
      case 'full':
        return 'max-w-full'
      case 'original':
      default:
        return 'max-w-fit'
    }
  }

  // sizes prop hints to the browser what image width to request.
  // Uses conservative estimates based on the container size the block will
  // actually occupy, rather than the full viewport width.
  const getSizesForImageSize = () => {
    switch (imageSize) {
      case 'small':
        return '(max-width: 640px) 100vw, 384px' // small caps at max-w-md = 28rem = 448px
      case 'medium':
        return '(max-width: 640px) 100vw, 672px' // medium caps at max-w-2xl = 42rem = 672px
      case 'large':
        return '(max-width: 640px) 100vw, 896px' // large caps at max-w-4xl = 56rem = 896px
      case 'full':
        return '100vw'
      case 'original':
      default:
        return '100vw'
    }
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
