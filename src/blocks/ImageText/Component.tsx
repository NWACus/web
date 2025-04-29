import RichText from '@/components/RichText'
import { cn } from '@/utilities/ui'

import { ImageMedia } from '@/components/Media/ImageMedia'
import type { ImageText as ImageTextProps } from '@/payload-types'
import Color from 'color'

type Props = ImageTextProps & {
  imgClassName?: string
}

export const ImageText = (props: Props) => {
  const { color, imgClassName, imageLayout, image, layoutSize, richText } = props

  const colsClasses: { [key: string]: { photo: string; text: string } } = {
    half: { photo: 'col-span-2 lg:col-span-6', text: 'col-span-2 lg:col-span-6' },
    third: { photo: 'col-span-1 lg:col-span-3', text: 'col-span-3 lg:col-span-9' },
  }
  const colsSpanClass = colsClasses[layoutSize]

  // TODO - import color list from theme
  const bgColorClass = `bg-[${color}]`
  const bgColor = Color(`${color}`)
  const textColor = bgColor.isLight() ? 'text-black' : 'text-white'
  return (
    <div className={`${bgColorClass}`}>
      <div className="container my-16">
        <div className="grid grid-cols-4 lg:grid-cols-12 gap-x-6">
          <div className={`${colsSpanClass.photo} ${imageLayout === 'right' && 'order-last'}`}>
            <ImageMedia imgClassName={cn(imgClassName)} resource={image} />
          </div>
          <div className={`${colsSpanClass.text} ${textColor}`}>
            <RichText data={richText} enableGutter={false} />
          </div>
        </div>
      </div>
    </div>
  )
}
