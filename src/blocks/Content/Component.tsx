import { blockSpacing } from '@/components/BackgroundColorWrapper'
import RichText from '@/components/RichText'
import type { ContentBlock as ContentBlockProps } from '@/payload-types'
import getTextColorFromBgColor from '@/utilities/getTextColorFromBgColor'
import { cn } from '@/utilities/ui'

export const ContentBlockComponent = (props: ContentBlockProps) => {
  const { columns, backgroundColor, layout } = props
  const layoutCols = layout ? layout.split('_')[1] : '1'

  const textColor = getTextColorFromBgColor(backgroundColor)

  const colsClasses: { [key: string]: string[] } = {
    '1': ['lg:col-span-12'],
    '11': ['md:col-span-3 lg:col-span-6', 'md:col-span-3 lg:col-span-6'],
    '12': ['md:col-span-2 lg:col-span-8', 'md:col-span-4'],
    '21': ['md:col-span-4', 'md:col-span-2 lg:col-span-8'],
    '111': [
      'sm:col-span-2 lg:col-span-4',
      'sm:col-span-2 lg:col-span-4',
      'sm:col-span-2 lg:col-span-4',
    ],
    '112': [
      'md:col-span-3 lg:col-span-6',
      'md:col-span-3 lg:col-span-3',
      'md:col-span-6 lg:col-span-3',
    ],
    '121': ['lg:col-span-3', 'lg:col-span-6', 'lg:col-span-3'],
    '211': [
      'md:col-span-6 lg:col-span-3',
      'md:col-span-3 lg:col-span-3',
      'md:col-span-3 lg:col-span-6',
    ],
    '1111': [
      'sm:col-span-3 lg:col-span-3',
      'sm:col-span-3 lg:col-span-3',
      'sm:col-span-3 lg:col-span-3',
      'sm:col-span-3 lg:col-span-3',
    ],
  }
  const colsSpanClass = colsClasses[layoutCols]
  const spacing = blockSpacing(backgroundColor, true)

  return (
    <div className={cn(spacing.outer, spacing.bg)}>
      <div className={cn('container', spacing.inner)}>
        <div className="grid grid-cols-6 lg:grid-cols-12 gap-y-6 gap-x-10">
          {columns?.map((col, index) => {
            const { richText } = col
            return (
              <div className={cn('col-span-6', colsSpanClass[index], textColor)} key={index}>
                {richText && <RichText data={richText} enableGutter={false} />}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
