import RichText from '@/components/RichText'
import type { HeaderBlock as HeaderBlockProps } from '@/payload-types'
import getTextColorFromBgColor from '@/utilities/getTextColorFromBgColor'
import { cn } from '@/utilities/ui'

export const HeaderBlockComponent = (props: HeaderBlockProps) => {
  const { backgroundColor, richText, wrapInContainer } = props

  const bgColorClass = `bg-${backgroundColor}`
  const textColor = getTextColorFromBgColor(backgroundColor)

  return (
    <div className={cn(!wrapInContainer && bgColorClass)}>
      <div className={cn('py-4 w-full', textColor, wrapInContainer && `${bgColorClass} container`)}>
        {richText && <RichText data={richText} enableGutter={false} />}
      </div>
    </div>
  )
}
