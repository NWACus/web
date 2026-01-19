import { cn } from '@/utilities/ui'

import { ImageMedia } from '@/components/Media/ImageMedia'
import { cssVariables } from '@/cssVariables'
import type { ImageQuote as ImageQuoteProps } from '@/payload-types'
import getTextColorFromBgColor from '@/utilities/getTextColorFromBgColor'

const { breakpoints, container } = cssVariables

/**
 * Generates the sizes attribute for the image in ImageQuote block.
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

type Props = ImageQuoteProps & {
  imgClassName?: string
}

export const ImageQuote = (props: Props) => {
  const { author, backgroundColor, imgClassName, imageLayout, image, quote } = props

  const bgColorClass = `bg-${backgroundColor}`
  const textColor = getTextColorFromBgColor(backgroundColor)

  return (
    <div className={`${bgColorClass}`}>
      <div className="container py-10">
        <div className="grid md:grid-cols-12 gap-6">
          <div
            className={`items-center md:col-span-4 self-start ${imageLayout === 'right' ? 'order-last md:ms-6' : 'md:me-6'}`}
          >
            {image && (
              <ImageMedia
                imgClassName={cn(imgClassName)}
                resource={image}
                sizes={getImageSizes()}
              />
            )}
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
