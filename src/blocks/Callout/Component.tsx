import type { CalloutBlock as CalloutBlockProps } from '@/payload-types'

import RichText from '@/components/RichText'
import getTextColorFromBgColor from '@/utilities/getTextColorFromBgColor'

export const CalloutBlock = ({ backgroundColor, callout }: CalloutBlockProps) => {
  if (!callout) return null
  const bgColorClass = `bg-${backgroundColor}`
  const textColor = getTextColorFromBgColor(backgroundColor)

  return (
    <div className={`p-8 rounded-sm w-full justify center ${bgColorClass} ${textColor}`}>
      <RichText className="mb-0" data={callout} enableGutter={false} />
    </div>
  )
}
