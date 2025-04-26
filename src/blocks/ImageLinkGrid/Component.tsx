import { cn } from '@/utilities/ui'

import type { ImageLinkGrid as ImageLinkGridProps } from '@/payload-types'

import { ImageMedia } from '@/components/Media/ImageMedia'

type Props = ImageLinkGridProps & {
  className?: string
  imgClassName?: string
}

export const ImageLinkGrid = (props: Props) => {
  const { columns, className, imgClassName } = props
  const numOfCols = columns?.length ?? 1

  const colsClasses: { [key: number]: string } = {
    1: 'lg:col-span-12',
    2: 'lg:col-span-6',
    3: 'lg:col-span-4',
    4: 'lg:col-span-3',
  }
  const colsSpanClass = colsClasses[numOfCols]

  return (
    <div className="container my-16">
      <div className={`grid grid-cols-4 lg:grid-cols-12`}>
        {columns &&
          columns?.length > 0 &&
          columns.map((col, index) => {
            const { caption, image, link } = col
            const lastOddElement = numOfCols % 2 && index === numOfCols - 1
            return (
              <div
                className={cn(
                  `relative my-6  ${colsSpanClass} ${className} ${lastOddElement && 'md:col-span-full'}`,
                )}
                key={index}
              >
                <a href={`${link?.url}`}>
                  <ImageMedia
                    imgClassName={cn('object-cover w-full max-h-[280px]', imgClassName)}
                    resource={image}
                  />
                  <div className="absolute w-full bg-black text-center text-white ">{caption}</div>
                </a>
              </div>
            )
          })}
      </div>
    </div>
  )
}
