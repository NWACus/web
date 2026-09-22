import { blockSpacing } from '@/components/BackgroundColorWrapper'
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
  const spacing = blockSpacing(backgroundColor, isLayoutBlock)

  return (
    <div className={cn(spacing.outer, fullWidthColor && bgColorClass)}>
      <div
        className={cn(
          'w-full',
          spacing.inner,
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
