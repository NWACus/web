import RichText from '@/components/RichText'
import getTextColorFromBgColor from '@/utilities/getTextColorFromBgColor'
import { cn } from '@/utilities/ui'
import { DataFromCollectionSlug } from 'payload'

type HighlightedContentProps = DataFromCollectionSlug<'homePages'>['highlightedContent'] & {
  className?: string
}

export default function HighlightedContent({
  heading,
  columns,
  backgroundColor,
  className,
}: HighlightedContentProps) {
  const bgColorClass = `bg-${backgroundColor}`
  const textColor = getTextColorFromBgColor(backgroundColor)

  const colsClasses: { [key: number]: string } = {
    1: 'lg:col-span-12',
    2: 'lg:col-span-6',
  }

  return (
    <div className={cn(bgColorClass, textColor, className)}>
      <div className="container py-6 md:py-8 flex flex-col items-center gap-6 md:gap-8">
        {heading && (
          <div className="prose md:prose-md dark:prose-invert">
            <h2>{heading}</h2>
          </div>
        )}
        {columns && columns.length > 0 && (
          <div className="grid grid-cols-4 lg:grid-cols-12 gap-y-8 gap-x-16">
            {columns?.map((col, index) => {
              const { richText } = col
              return (
                <div
                  className={cn(
                    'col-span-4 md:col-span-2',
                    columns &&
                      columns.length > 0 &&
                      columns.length <= 2 &&
                      colsClasses[columns.length],
                    textColor,
                  )}
                  key={index}
                >
                  {richText && <RichText data={richText} enableGutter={false} />}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
