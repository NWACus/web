import RichText from '@/components/RichText'
import { cn } from '@/utilities/ui'

import { ImageMedia } from '@/components/Media/ImageMedia'
import type { ImageText as ImageTextProps } from '@/payload-types'
import Color from 'color'

type Props = ImageTextProps & {
  imgClassName?: string
}

export const ImageText = (props: Props) => {
  const { color, imgClassName, imageLayout, image, richText } = props

  // TODO - import color list from theme
  const bgColorClass = `bg-[${color}]`
  const bgColor = Color(`${color}`)
  const textColor = bgColor.isLight() ? 'text-black' : 'text-white'
  return (
    <div className={`${bgColorClass}`}>
      <div className="w-full max-w-xl md:max-w-4xl lg:max-w-5xl mx-auto px-4 py-16">
        <div className="grid md:grid-cols-12 gap-x-6 gap-y-6 justify-items-center-safe">
          <div
            className={`items-center md:col-span-4 self-start ${imageLayout === 'right' && 'order-last'}`}
          >
            <ImageMedia imgClassName={cn(imgClassName)} resource={image} />
          </div>
          <div className={`md:col-span-8 self-center ${textColor}`}>
            <RichText data={richText} enableGutter={false} />
          </div>
        </div>
      </div>
    </div>
  )
}
