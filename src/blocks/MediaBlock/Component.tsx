import type { StaticImageData } from 'next/image'

import RichText from '@/components/RichText'
import { cn } from '@/utilities/ui'

import type { MediaBlock as MediaBlockProps } from '@/payload-types'

import { Media } from '@/components/Media'
import { cssVariables } from '@/cssVariables'
import getTextColorFromBgColor from '@/utilities/getTextColorFromBgColor'

const { breakpoints } = cssVariables

type Props = MediaBlockProps & {
  captionClassName?: string
  className?: string
  wrapInContainer?: boolean
  imgClassName?: string
  staticImage?: StaticImageData
}

export const MediaBlock = (props: Props) => {
  const {
    caption,
    captionClassName,
    className,
    wrapInContainer = true,
    imgClassName,
    media,
    staticImage,
    alignContent = 'left',
    backgroundColor,
    imageSize = 'original',
  } = props

  const bgColorClass = `bg-${backgroundColor}`
  const textColor = getTextColorFromBgColor(backgroundColor)

  const getImageSizeClasses = () => {
    switch (imageSize) {
      case 'small':
        return 'max-w-xs md:max-w-sm lg:max-w-md'
      case 'medium':
        return 'max-w-sm md:max-w-lg lg:max-w-2xl'
      case 'large':
        return 'max-w-md md:max-w-2xl lg:max-w-4xl'
      case 'full':
        return 'max-w-full'
      case 'original':
      default:
        return 'max-w-fit'
    }
  }

  // sizes prop hints to browser what image width to request based on imageSize setting
  // Uses breakpoints from cssVariables for consistency with other image components
  const getSizesForImageSize = () => {
    switch (imageSize) {
      case 'small':
        return `(max-width: ${breakpoints.md}px) 100vw, 384px` // max-w-sm = 24rem = 384px
      case 'medium':
        return `(max-width: ${breakpoints.md}px) 100vw, 672px` // max-w-2xl = 42rem = 672px
      case 'large':
        return `(max-width: ${breakpoints.md}px) 100vw, 896px` // max-w-4xl = 56rem = 896px
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
          wrapInContainer && 'container py-10',
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
              size={getSizesForImageSize()}
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
