import RichText from '@/components/RichText'
import { cn } from '@/utilities/ui'

import type { ContentBlock as ContentBlockProps } from '@/payload-types'

export const ContentBlock = (props: ContentBlockProps) => {
  const { enableColumns, columns, content, color } = props
  const numOfCols = columns?.length ?? 1

  const bgColorClass = `bg-[${color}]`

  const colsClasses: { [key: number]: string } = {
    1: 'lg:col-span-12',
    2: 'lg:col-span-6',
    3: 'lg:col-span-4',
    4: 'lg:col-span-3',
  }
  const colsSpanClass = colsClasses[numOfCols]

  return (
    <div className={`container py-16 ${bgColorClass}`}>
      <div className="grid grid-cols-4 lg:grid-cols-12 gap-y-8 gap-x-16">
        {enableColumns ? (
          columns?.map((col, index) => {
            const { richText } = col

            return (
              <div className={cn(`col-span-4 md:col-span-2 ${colsSpanClass}`)} key={index}>
                {richText && <RichText data={richText} enableGutter={false} />}
              </div>
            )
          })
        ) : (
          <div className={cn(`col-span-4 lg:col-span-12`)}>
            {content?.richText && <RichText data={content.richText} enableGutter={false} />}
          </div>
        )}
      </div>
    </div>
  )
}
