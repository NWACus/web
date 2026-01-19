import { cn } from '@/utilities/ui'

import type { ImageLinkGrid as ImageLinkGridProps } from '@/payload-types'

import { ImageMedia } from '@/components/Media/ImageMedia'
import { cssVariables } from '@/cssVariables'
import { handleReferenceURL } from '@/utilities/handleReferenceURL'
import Link from 'next/link'

const { breakpoints, container } = cssVariables

type Props = ImageLinkGridProps & {
  className?: string
  imgClassName?: string
}

/**
 * Generates the sizes attribute for responsive images based on column count.
 * The sizes attribute tells the browser how wide the image will display at each viewport,
 * allowing it to select the optimal image size from srcset before downloading.
 *
 * Layout behavior:
 * - Below sm breakpoint: single column layout, image takes full viewport width
 * - sm and above: multi-column grid, image width = container width / numOfCols
 */
const getImageSizes = (numOfCols: number): string => {
  return [
    `(max-width: ${breakpoints.sm}px) 100vw`,
    `(max-width: ${breakpoints.md}px) ${Math.round(container.sm / numOfCols)}px`,
    `(max-width: ${breakpoints.lg}px) ${Math.round(container.md / numOfCols)}px`,
    `(max-width: ${breakpoints.xl}px) ${Math.round(container.lg / numOfCols)}px`,
    `(max-width: ${breakpoints['2xl']}px) ${Math.round(container.xl / numOfCols)}px`,
    `${Math.round(container['2xl'] / numOfCols)}px`,
  ].join(', ')
}

export const ImageLinkGrid = (props: Props) => {
  const { columns, className, imgClassName } = props
  const numOfCols = columns?.length ?? 1

  const colsClasses: { [key: number]: string } = {
    1: 'sm:col-span-12',
    2: 'sm:col-span-6',
    3: 'sm:col-span-4',
    4: 'sm:col-span-3',
  }
  const colsSpanClass = colsClasses[numOfCols]
  const imageSizes = getImageSizes(numOfCols)

  return (
    <div className="container py-10">
      <div className="grid sm:grid-cols-12 gap-3">
        {columns &&
          columns?.length > 0 &&
          columns.map((col, index) => {
            const { caption, image, link } = col
            const href = handleReferenceURL({ ...link })
            const newTabProps = link?.newTab ? { rel: 'noopener noreferrer', target: '_blank' } : {}

            return (
              <div className={cn('group', colsSpanClass, className)} key={index}>
                <Link href={href || ''} {...newTabProps}>
                  <div className="w-full h-[280px] overflow-hidden">
                    {image && (
                      <ImageMedia
                        pictureClassName="h-full"
                        imgClassName={cn(
                          'object-cover w-full h-full group-hover:scale-105 transition-transform duration-300 ease-in-out overflow-hidden',
                          imgClassName,
                        )}
                        resource={image}
                        sizes={imageSizes}
                      />
                    )}
                  </div>
                  {caption && (
                    <div className="w-full bg-accent p-2 text-small text-center group-hover:bg-accent/90">
                      {caption}
                    </div>
                  )}
                </Link>
              </div>
            )
          })}
      </div>
    </div>
  )
}
