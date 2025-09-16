import RichText from '@/components/RichText'
import type { ContentBlock as ContentBlockProps } from '@/payload-types'
import getTextColorFromBgColor from '@/utilities/getTextColorFromBgColor'
import { cn } from '@/utilities/ui'

export const ContentBlock = (props: ContentBlockProps) => {
  const { columns, backgroundColor, layout } = props
  const layoutCols = layout ? layout.split('_')[1] : '1'

  const bgColorClass = `bg-${backgroundColor}`
  const textColor = getTextColorFromBgColor(backgroundColor)

  const colsClasses: { [key: string]: string[] } = {
    '1': ['lg:col-span-12'],
    '11': ['lg:col-span-6', 'lg:col-span-6'],
    '12': ['lg:col-span-8', 'lg:col-span-4'],
    '21': ['lg:col-span-4', 'lg:col-span-8'],
    '111': ['lg:col-span-4', 'lg:col-span-4', 'lg:col-span-4'],
    '112': ['lg:col-span-6', 'lg:col-span-3', 'lg:col-span-3'],
    '121': ['lg:col-span-3', 'lg:col-span-6', 'lg:col-span-3'],
    '211': ['lg:col-span-3', 'lg:col-span-3', 'lg:col-span-6'],
    '1111': ['lg:col-span-3', 'lg:col-span-3', 'lg:col-span-3', 'lg:col-span-3'],
  }
  const colsSpanClass = colsClasses[layoutCols]

  return (
    <div className={`${bgColorClass}`}>
      <div className="container py-10">
        <div className="grid grid-cols-2 lg:grid-cols-12 gap-y-8 gap-x-16">
          {columns?.map((col, index) => {
            const { richText } = col
            return (
              <div className={cn('col-span-2', colsSpanClass[index], textColor)} key={index}>
                {richText && <RichText data={richText} enableGutter={false} />}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
