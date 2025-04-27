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
    1: 'sm:col-span-12',
    2: 'sm:col-span-6',
    3: 'sm:col-span-4',
    4: 'sm:col-span-3',
  }
  const colsSpanClass = colsClasses[numOfCols]

  return (
    <div className="container">
      <div className="grid sm:grid-cols-12 gap-y-2 gap-x-2">
        {columns &&
          columns?.length > 0 &&
          columns.map((col, index) => {
            const { caption, image, link } = col
            const lastOddElement = numOfCols % 2 && index === numOfCols - 1
            return (
              <div className={cn(`relative ${colsSpanClass} ${className}}`)} key={index}>
                <a href={`${link?.url}`}>
                  <ImageMedia
                    imgClassName={cn('object-cover w-full h-[280px]', imgClassName)}
                    resource={image}
                  />
                  <div className="absolute bottom-0 w-full bg-accent p-2 text-small text-center">
                    {caption}
                  </div>
                </a>
              </div>
            )
          })}
      </div>
    </div>
  )
}
