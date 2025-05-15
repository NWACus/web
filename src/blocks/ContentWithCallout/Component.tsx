import type { ContentWithCalloutBlock as ContentWithCalloutBlockProps } from '@/payload-types'

import RichText from '@/components/RichText'

export const ContentWithCalloutBlock = ({
  callout,
  enableCallout,
  richText,
}: ContentWithCalloutBlockProps) => {
  return (
    <div className="container">
      {enableCallout ? (
        <div className="flex flex-col md:flex-row items-center gap-4">
          {richText && <RichText className="mb-0" data={richText} enableGutter={false} />}
          {callout && (
            <div className="p-6 bg-brand-200 rounded-sm">
              <RichText className="mb-0" data={callout} enableGutter={false} />
            </div>
          )}
        </div>
      ) : (
        <>{richText && <RichText className="mb-0" data={richText} enableGutter={false} />}</>
      )}
    </div>
  )
}
