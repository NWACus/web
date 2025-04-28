import RichText from '@/components/RichText'
import { cn } from '@/utilities/ui'

import type { ContentBlock as ContentBlockProps } from '@/payload-types'

export const ContentBlock = (props: ContentBlockProps) => {
  const { columns } = props

  return (
    <div className="container my-16">
      <div className="grid grid-cols-4 lg:grid-cols-12 gap-y-8 gap-x-16">
        {columns &&
          columns.length > 0 &&
          columns.map((col, index) => {
            const { richText } = col

            return (
              <div className={cn(`col-span-4 md:col-span-2 lg:col-span-full`)} key={index}>
                {richText && <RichText data={richText} enableGutter={false} />}
              </div>
            )
          })}
      </div>
    </div>
  )
}
