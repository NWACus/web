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
    <div className="bg-slate-500 py-8">
      <div className="container grid grid-cols-4 lg:grid-cols-12 gap-x-2">
        {cards &&
          cards.length > 0 &&
          cards.map((card, index) => {
            const { image, link, text, title } = card
            const lastOddElement = numOfCols % 2 && index === numOfCols - 1
            return (
              <div
                className={cn(
                  `col-span-4 sm:col-span-2 my-1 ${colsSpanClass} 
                  ${lastOddElement && 'sm:col-start-2'} 
                  p-6 bg-white rounded-lg grid`,
                )}
                key={index}
              >
                <Media imgClassName={'w-full border border-border'} resource={image} />
                <div className="flex flex-col justify-between items-start">
                  <div>
                    <h3 className="text-lg font-semibold mt-6">{title}</h3>
                    <p className="text-sm mt-2 mb-6">{text}</p>
                  </div>
                  <CMSLink {...link} />
                </div>
              </div>
            )
          })}
      </div>
    </div>
  )
}
