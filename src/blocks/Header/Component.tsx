import { hasBackgroundColor } from '@/components/BackgroundColorWrapper'
import RichText from '@/components/RichText'
import type { HeaderBlock as HeaderBlockProps } from '@/payload-types'
import getTextColorFromBgColor from '@/utilities/getTextColorFromBgColor'
import { cn } from '@/utilities/ui'

type Props = HeaderBlockProps & {
  isLayoutBlock: boolean
  fullWidthColor?: boolean | null
}

export const HeaderBlockComponent = (props: Props) => {
  const { backgroundColor, fullWidthColor, richText, horizontalLine, isLayoutBlock } = props

  const bgColorClass = `bg-${backgroundColor}`
  const textColor = getTextColorFromBgColor(backgroundColor)

  return (
    <div
      className={cn(
        isLayoutBlock && !hasBackgroundColor(backgroundColor) && 'my-10',
        fullWidthColor && bgColorClass,
      )}
    >
      <div
        className={cn(
          'pt-4 w-full',
          hasBackgroundColor(backgroundColor) && 'pb-4',
          textColor,
          { container: isLayoutBlock },
          !fullWidthColor && `${bgColorClass}`,
        )}
      >
        <RichText data={richText} enableGutter={false} className={cn(!isLayoutBlock && 'px-4')} />
        {horizontalLine && <hr className={cn('mt-2 border-current', !isLayoutBlock && 'mx-4')} />}
      </div>
    </div>
  )
}
