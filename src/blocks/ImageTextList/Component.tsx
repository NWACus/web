import type { StaticImageData } from 'next/image'

import RichText from '@/components/RichText'
import React from 'react'
import { cn } from 'src/utilities/cn'

import type { ImageTextList as ImageTextListProps } from '@/payload-types'

import { Media } from '@/components/Media'

type Props = ImageTextListProps & {
  className?: string
  enableGutter?: boolean
  imgClassName?: string
  staticImage?: StaticImageData
}

export const ImageTextList: React.FC<Props> = (props) => {
  const { columns, className, enableGutter = true, imgClassName, staticImage } = props
  const numOfCols = columns?.length ?? 1

  const colsClasses = {
    1: 'lg:col-span-12',
    2: 'lg:col-span-6',
    3: 'lg:col-span-4',
    4: 'lg:col-span-3',
  }
  const colsSpanClass = colsClasses[numOfCols]

  return (
    <div className="container my-16">
      <div className="grid grid-cols-4 lg:grid-cols-12">
        {columns &&
          columns.length > 0 &&
          columns.map((col, index) => {
            const { image, richText, title } = col
            const lastOddElement = numOfCols % 2 && index === numOfCols - 1
            return (
              <div
                className={cn(
                  `col-span-4 md:col-span-2 ${colsSpanClass} ${lastOddElement && 'md:col-span-full'}`,
                )}
                key={index}
              >
                <div
                  className={cn(
                    {
                      container: enableGutter,
                    },
                    className,
                  )}
                >
                  {(image || staticImage) && (
                    <Media
                      imgClassName={cn('h-[108px]', imgClassName)}
                      resource={image}
                      src={staticImage}
                    />
                  )}
                  <div className={cn('mt-6')}>{title}</div>

                  <div className={cn('mt-2')}>
                    <RichText data={richText} enableGutter={false} />
                  </div>
                </div>
              </div>
            )
          })}
      </div>
    </div>
  )
}
