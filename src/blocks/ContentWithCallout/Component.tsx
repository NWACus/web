import type { ContentWithCalloutBlock as ContentWithCalloutBlockProps } from '@/payload-types'

import RichText from '@/components/RichText'

export const ContentWithCalloutBlock = ({ callout, richText }: ContentWithCalloutBlockProps) => {
  return (
    <div className="container py-4">
      <div className="flex flex-col md:flex-row items-center gap-4">
        {richText && (
          <div className="md:basis-2/3 md:flex-shrink-0 md:flex-grow-0 w-full">
            <RichText className="mb-0" data={richText} enableGutter={false} />
          </div>
        )}
        {callout && (
          <div className="p-6 bg-brand-200 rounded-sm md:basis-1/3 md:flex-shrink-0 md:flex-grow-0 w-full">
            <RichText className="mb-0" data={callout} enableGutter={false} />
          </div>
        )}
      </div>
    </div>
  )
}
