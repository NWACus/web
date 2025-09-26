import type { StaticImageData } from 'next/image'

import RichText from '@/components/RichText'
import { cn } from '@/utilities/ui'

import type { MediaBlock as MediaBlockProps } from '@/payload-types'

import { Media } from '@/components/Media'
import getTextColorFromBgColor from '@/utilities/getTextColorFromBgColor'

type Props = MediaBlockProps & {
  captionClassName?: string
  className?: string
  wrapInContainer?: boolean
  imgClassName?: string
  staticImage?: StaticImageData
}

export const MediaBlock = (props: Props) => {
  const {
    captionClassName,
    className,
    wrapInContainer = true,
    imgClassName,
    media,
    staticImage,
    alignContent = 'left',
    backgroundColor,
  } = props

  let caption
  if (media && typeof media === 'object') caption = media.caption

  const bgColorClass = `bg-${backgroundColor}`
  const textColor = getTextColorFromBgColor(backgroundColor)

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
          <Media
            className="my-0"
            imgClassName={cn('mx-auto', imgClassName)}
            resource={media}
            src={staticImage}
          />
        )}
        {caption && (
          <div className={cn('mt-4', captionClassName)}>
            <RichText data={caption} enableGutter={false} className="text-xs" />
          </div>
        )}
      </div>
    </div>
  )
}
