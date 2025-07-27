import RichText from '@/components/RichText'
import { cn } from '@/utilities/ui'

import { ImageMedia } from '@/components/Media/ImageMedia'
import type { ImageTextList as ImageTextListProps } from '@/payload-types'

type Props = ImageTextListProps & {
  className?: string
  imgClassName?: string
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

  return (
    <div className="container my-16">
      <div className={`grid grid-cols-4 lg:grid-cols-12 ${!isFullLayout && 'gap-x-4'}`}>
        {columns &&
          columns.length > 0 &&
          columns.map((col, index) => {
            const { image, richText, title } = col
            const lastOddElement = numOfCols % 2 && index === numOfCols - 1
            return (
              <div
                className={cn(`my-6
                  ${
                    isFullLayout
                      ? 'col-span-full'
                      : `col-span-4 md:col-span-2  ${colsSpanClass} ${lastOddElement && 'md:col-span-full'} `
                  }`)}
                key={index}
              >
                <div
                  className={cn(`${isSideLayout && 'grid grid-cols-4 gap-x-4 ms-auto'}`, className)}
                >
                  {image && (
                    <ImageMedia
                      imgClassName={cn(
                        'h-[108px] max-w-fit',
                        `${isSideLayout && 'grid grid-cols-4 gap-x-4 ms-auto'}`,
                        imgClassName,
                      )}
                      resource={image}
                    />
                  )}
                  <div className={`${isSideLayout ? 'col-span-3' : 'mt-4'}`}>
                    <h3 className="text-lg font-bold">{title}</h3>
                    <div className="mt-2">
                      <RichText data={richText} enableGutter={false} enableProse={false} />
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
