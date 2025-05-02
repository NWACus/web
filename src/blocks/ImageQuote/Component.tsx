import { cn } from '@/utilities/ui'

import { ImageMedia } from '@/components/Media/ImageMedia'
import type { ImageQuote as ImageQuoteProps } from '@/payload-types'
import Color from 'color'

type Props = ImageQuoteProps & {
  imgClassName?: string
}

export const ImageQuote = (props: Props) => {
  const { author, color, imgClassName, imageLayout, image, quote } = props

  // TODO - import color list from theme
  const bgColorClass = `bg-[${color}]`
  const bgColor = Color(`${color}`)
  const textColor = bgColor.isLight() ? 'text-black' : 'text-white'
  return (
    <div className={`${bgColorClass}`}>
      <div className="container md:px-0 py-16">
        <div className="grid md:grid-cols-12 gap-x-6 gap-y-6 justify-items-center">
          <div
            className={`items-center md:col-span-4 self-start ${imageLayout === 'right' && 'order-last'}`}
          >
            <ImageMedia imgClassName={cn(imgClassName)} resource={image} />
          </div>
          <div className={`md:col-span-8 self-center ${textColor}`}>
            <blockquote className="border-s-4 ms-6 ps-6 ">
              <div className="italic text-lg">{quote}</div>
              <div className="mt-4">{author}</div>
            </blockquote>
          </div>
        </div>
      </div>
    </div>
  )
}
