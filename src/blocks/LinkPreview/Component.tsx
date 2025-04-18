import { CMSLink } from '@/components/Link'
import { Media } from '@/components/Media'

import type { LinkPreviewBlock as LinkPreviewBlockProps } from '@/payload-types'
import { cn } from '@/utilities/cn'

export const LinkPreviewBlock = (props: LinkPreviewBlockProps) => {
  const { cards } = props

  const numOfCols = cards?.length ?? 2

  const colsClasses: { [key: number]: string } = {
    2: 'lg:col-span-6',
    3: 'lg:col-span-4',
  }
  const colsSpanClass = colsClasses[numOfCols]

  return (
    <div className="bg-slate-500 py-16">
      <div className="container grid grid-cols-4 lg:grid-cols-12 gap-x-12">
        {cards &&
          cards.length > 0 &&
          cards.map((col, index) => {
            const { image, link, text, title } = col
            const lastOddElement = numOfCols % 2 && index === numOfCols - 1

            return (
              <div
                className={cn(
                  `col-span-4 md:col-span-2 ${colsSpanClass} ${lastOddElement && 'md:col-span-full'} p-6 bg-white rounded-xl`,
                )}
                key={index}
              >
                <Media imgClassName={'w-full border border-border'} resource={image} />

                <h3 className="text-lg font-bold mt-6">{title}</h3>
                <p className="my-4">{text}</p>

                <CMSLink {...link} />
              </div>
            )
          })}
      </div>
    </div>
  )
}
