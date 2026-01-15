import RichText from '@/components/RichText'
import { cn } from '@/utilities/ui'

import { ImageMedia } from '@/components/Media/ImageMedia'
import { cssVariables } from '@/cssVariables'
import type { ImageTextList as ImageTextListProps } from '@/payload-types'

const { breakpoints, container } = cssVariables

type Props = ImageTextListProps & {
  className?: string
  imgClassName?: string
}

/**
 * Generates the sizes attribute for responsive images based on column count and layout.
 * The sizes attribute tells the browser how wide the image will display at each viewport,
 * allowing it to select the optimal image size from srcset before downloading.
 *
 * Layout behavior:
 * - Full layout: image takes full container width at all breakpoints
 * - Side/default layout:
 *   - Below md: full width (col-span-4 on 4-col grid)
 *   - md to lg: half width (col-span-2 on 4-col grid)
 *   - lg and above: width based on numOfCols (12, 6, 4, or 3 cols out of 12)
 */
const getImageSizes = (numOfCols: number, isFullLayout: boolean): string => {
  if (isFullLayout) {
    return [
      `(max-width: ${breakpoints.sm}px) 100vw`,
      `(max-width: ${breakpoints.md}px) ${container.sm}px`,
      `(max-width: ${breakpoints.lg}px) ${container.md}px`,
      `(max-width: ${breakpoints.xl}px) ${container.lg}px`,
      `(max-width: ${breakpoints['2xl']}px) ${container.xl}px`,
      `${container['2xl']}px`,
    ].join(', ')
  }

  // Column span mapping: 1->12, 2->6, 3->4, 4->3 (out of 12 columns at lg)
  const lgColSpan = 12 / numOfCols

  return [
    // Below md: full width (col-span-4 on 4-col grid)
    `(max-width: ${breakpoints.md}px) 100vw`,
    // md to lg: half width (col-span-2 on 4-col grid = 50%)
    `(max-width: ${breakpoints.lg}px) ${Math.round(container.md / 2)}px`,
    // lg and above: width based on column span ratio
    `(max-width: ${breakpoints.xl}px) ${Math.round((container.lg * lgColSpan) / 12)}px`,
    `(max-width: ${breakpoints['2xl']}px) ${Math.round((container.xl * lgColSpan) / 12)}px`,
    `${Math.round((container['2xl'] * lgColSpan) / 12)}px`,
  ].join(', ')
}

export const ImageTextList = (props: Props) => {
  const { columns, className, imgClassName, layout } = props
  const numOfCols = columns?.length ?? 1

  const colsClasses: { [key: number]: string } = {
    1: 'lg:col-span-12',
    2: 'lg:col-span-6',
    3: 'lg:col-span-4',
    4: 'lg:col-span-3',
  }
  const colsSpanClass = colsClasses[numOfCols]

  const isFullLayout = layout === 'full'
  const isSideLayout = layout === 'side'
  const imageSizes = getImageSizes(numOfCols, isFullLayout)

  return (
    <div className="container py-10">
      <div className="grid grid-cols-4 lg:grid-cols-12 gap-4">
        {columns &&
          columns.length > 0 &&
          columns.map((col, index) => {
            const { image, richText, title } = col
            const lastOddElement = numOfCols % 2 && index === numOfCols - 1
            return (
              <div
                className={cn(`
                  ${
                    isFullLayout
                      ? 'col-span-full'
                      : `col-span-4 md:col-span-2  ${colsSpanClass} ${lastOddElement && 'md:col-span-full'} `
                  }`)}
                key={`img-text-list__${index}`}
              >
                <div
                  className={cn({ 'grid grid-cols-4 gap-x-4 ms-auto': isSideLayout }, className)}
                >
                  {image && (
                    <ImageMedia
                      imgClassName={cn(
                        'h-auto max-h-[300px] max-w-full object-contain',
                        `${isSideLayout && 'grid grid-cols-4 gap-x-4 ms-auto'}`,
                        imgClassName,
                      )}
                      pictureClassName="overflow-hidden"
                      resource={image}
                      size={imageSizes}
                    />
                  )}
                  <div className={`${isSideLayout ? 'col-span-3' : 'mt-4'}`}>
                    <h3 className="text-lg font-bold">{title}</h3>
                    <div className="mt-2">
                      <RichText data={richText} enableGutter={false} />
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
      </div>
    </div>
  )
}
