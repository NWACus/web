import RichText from '@/components/RichText'
import { cn } from '@/utilities/ui'

import { BackgroundColorWrapper } from '@/components/BackgroundColorWrapper'
import { ImageMedia } from '@/components/Media/ImageMedia'
import { cssVariables } from '@/cssVariables'
import type { ImageTextBlock as ImageTextBlockProps } from '@/payload-types'
import getTextColorFromBgColor from '@/utilities/getTextColorFromBgColor'

const { breakpoints, container } = cssVariables

/**
 * Generates the sizes attribute for the image in ImageText block.
 * Layout behavior:
 * - Below md breakpoint: single column layout, image takes full viewport width
 * - md and above: 12-column grid where image spans 4 columns (1/3 of container)
 */
const getImageSizes = (): string => {
  // Image spans 4 of 12 columns = 1/3 of container width
  const imageRatio = 4 / 12
  return [
    `(max-width: ${breakpoints.md}px) 100vw`,
    `(max-width: ${breakpoints.lg}px) ${Math.round(container.md * imageRatio)}px`,
    `(max-width: ${breakpoints.xl}px) ${Math.round(container.lg * imageRatio)}px`,
    `(max-width: ${breakpoints['2xl']}px) ${Math.round(container.xl * imageRatio)}px`,
    `${Math.round(container['2xl'] * imageRatio)}px`,
  ].join(', ')
}

type Props = ImageTextBlockProps & {
  isLayoutBlock: boolean
  imgClassName?: string
}

export const ImageTextBlockComponent = (props: Props) => {
  const { backgroundColor, imgClassName, imageLayout, image, richText, textWrap, isLayoutBlock } =
    props

  const textColor = getTextColorFromBgColor(backgroundColor)

  return (
    <BackgroundColorWrapper backgroundColor={backgroundColor} isLayoutBlock={isLayoutBlock}>
      <div className="grid md:grid-cols-12 gap-x-6 gap-y-6 justify-items-center-safe">
        <div
          className={`items-center md:col-span-4 self-start ${imageLayout === 'right' && 'order-last'}`}
        >
          {image && (
            <ImageMedia imgClassName={cn(imgClassName)} resource={image} sizes={getImageSizes()} />
          )}
        </div>
        <div className={`md:col-span-8 self-center ${textColor}`}>
          <RichText data={richText} enableGutter={false} />
        </div>
      </div>
    </BackgroundColorWrapper>
  )
}
