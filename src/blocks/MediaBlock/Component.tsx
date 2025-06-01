import type { StaticImageData } from 'next/image'

import RichText from '@/components/RichText'
import { cn } from '@/utilities/ui'

import type { MediaBlock as MediaBlockProps } from '@/payload-types'

import { Media } from '@/components/Media'

type Props = MediaBlockProps & {
  breakout?: boolean
  captionClassName?: string
  className?: string
  enableGutter?: boolean
  imgClassName?: string
  staticImage?: StaticImageData
  disableInnerContainer?: boolean
}

export const MediaBlock = (props: Props) => {
  const {
    captionClassName,
    className,
    enableGutter = true,
    imgClassName,
    media,
    staticImage,
    disableInnerContainer,
  } = props

  let caption
  if (media && typeof media === 'object') caption = media.caption

  return (
    <div
      className={cn(
        'my-4',
        {
          container: enableGutter,
        },
        className,
      )}
    >
      {(media || staticImage) && (
        <Media
          className="my-0"
          imgClassName={cn(imgClassName)}
          resource={media}
          src={staticImage}
        />
      )}
      {caption && (
        <div
          className={cn(
            {
              container: !disableInnerContainer,
            },
            captionClassName,
          )}
        >
          <RichText data={caption} enableGutter={false} className="text-xs" />
        </div>
      )}
    </div>
  )
}
