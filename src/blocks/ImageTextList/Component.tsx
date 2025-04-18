import RichText from '@/components/RichText'
import { cn } from '@/utilities/ui'

import type { ImageTextList as ImageTextListProps } from '@/payload-types'

import { Media } from '@/components/Media'

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

  const isAboveLayout = layout === 'above'
  const isFullLayout = layout === 'full'
  const isSideLayout = layout === 'side'

  return (
    <div className="container my-16">
      <div className={`grid grid-cols-4 lg:grid-cols-12 ${isAboveLayout && 'gap-x-4'}`}>
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
                    <Media
                      imgClassName={cn(
                        'h-[108px]',
                        `${isSideLayout && 'grid grid-cols-4 gap-x-4 ms-auto'}`,
                        imgClassName,
                      )}
                      resource={image}
                    />
                  )}
                  <div className={`${isSideLayout ? 'col-span-3' : 'mt-4'}`}>
                    <h4 className="font-bold">{title}</h4>

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
