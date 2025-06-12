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
      <div className="grid sm:grid-cols-12 gap-3">
        {columns &&
          columns?.length > 0 &&
          columns.map((col, index) => {
            const { caption, image, link } = col

            return (
              <div className={cn('group', colsSpanClass, className)} key={index}>
                <a href={`${link?.url}`}>
                  <div className="w-full h-[280px] overflow-hidden">
                    <ImageMedia
                      pictureClassName="h-full"
                      imgClassName={cn(
                        'object-cover w-full h-full group-hover:scale-105 transition-transform duration-300 ease-in-out overflow-hidden',
                        imgClassName,
                      )}
                      resource={image}
                    />
                  </div>
                  <div className="w-full bg-accent p-2 text-small text-center group-hover:bg-accent/90">
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
