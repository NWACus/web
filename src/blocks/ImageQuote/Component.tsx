import { cn } from '@/utilities/ui'

import { ImageMedia } from '@/components/Media/ImageMedia'
import type { ImageQuote as ImageQuoteProps } from '@/payload-types'
import getTextColorFromBgColor from '@/utilities/getTextColorFromBgColor'

type Props = ImageQuoteProps & {
  imgClassName?: string
}

export const ImageQuote = (props: Props) => {
  const { author, backgroundColor, imgClassName, imageLayout, image, quote } = props

  const bgColorClass = `bg-${backgroundColor}`
  const textColor = getTextColorFromBgColor(backgroundColor)

  return (
    <div className={`${bgColorClass}`}>
      <div className="container py-16">
        <div className="grid md:grid-cols-12 gap-x-6 gap-y-6">
          <div
            className={`items-center md:col-span-4 self-start ${imageLayout === 'right' ? 'order-last ms-6' : 'me-6 '}`}
          >
            {image && <ImageMedia imgClassName={cn(imgClassName)} resource={image} />}
          </div>
          <div className={`md:col-span-8 self-center ${textColor}`}>
            <blockquote className="border-s-4 ps-6 ">
              <div className="italic text-lg">{quote}</div>
              <div className="mt-4">{author}</div>
            </blockquote>
          </div>
        </div>
      </div>
    </div>
  )
}
