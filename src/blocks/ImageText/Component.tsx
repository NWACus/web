import RichText from '@/components/RichText'
import { cn } from '@/utilities/ui'

import { ImageMedia } from '@/components/Media/ImageMedia'
import type { ImageText as ImageTextProps } from '@/payload-types'
import getTextColorFromBgColor from '@/utilities/getTextColorFromBgColor'

type Props = ImageTextProps & {
  imgClassName?: string
}

export const ImageText = (props: Props) => {
  const { backgroundColor, imgClassName, imageLayout, image, richText } = props

  const bgColorClass = `bg-${backgroundColor}`
  const textColor = getTextColorFromBgColor(backgroundColor)

  return (
    <div className={`${bgColorClass}`}>
      <div className="container py-16">
        <div className="grid md:grid-cols-12 gap-x-6 gap-y-6 justify-items-center-safe">
          <div
            className={`items-center md:col-span-4 self-start ${imageLayout === 'right' && 'order-last'}`}
          >
            {image && <ImageMedia imgClassName={cn(imgClassName)} resource={image} />}
          </div>
          <div className={`md:col-span-8 self-center ${textColor}`}>
            <RichText data={richText} enableGutter={false} />
          </div>
        </div>
      </div>
    </div>
  )
}
