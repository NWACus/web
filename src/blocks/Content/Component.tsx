import RichText from '@/components/RichText'
import type { ContentBlock as ContentBlockProps } from '@/payload-types'
import getTextColorFromBgColor from '@/utilities/getTextColorFromBgColor'
import { cn } from '@/utilities/ui'

export const ContentBlock = (props: ContentBlockProps) => {
  const { columns, backgroundColor } = props
  const numOfCols = columns?.length ?? 1

  const bgColorClass = `bg-${backgroundColor}`
  const textColor = getTextColorFromBgColor(backgroundColor)

  const colsClasses: { [key: number]: string } = {
    1: 'lg:col-span-12',
    2: 'lg:col-span-6',
    3: 'lg:col-span-4',
    4: 'lg:col-span-3',
  }
  const colsSpanClass = colsClasses[numOfCols]

  return (
    <div className={`${bgColorClass}`}>
      <div className="container py-16">
        <div className="grid grid-cols-4 lg:grid-cols-12 gap-y-8 gap-x-16">
          {columns?.map((col, index) => {
            const { richText } = col
            return (
              <div className={cn('col-span-4 md:col-span-2', colsSpanClass, textColor)} key={index}>
                {richText && <RichText data={richText} enableGutter={false} />}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
