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
  const { backgroundColor, fullWidthColor, richText, isLayoutBlock } = props

  const textColor = getTextColorFromBgColor(backgroundColor)
  const spacing = blockSpacing(backgroundColor)

  return (
    <div className={cn(fullWidthColor && spacing.bg)}>
      <div
        className={cn(
          'w-full',
          // Inline headers sit in prose, outside the block rhythm
          isLayoutBlock ? spacing.inner : 'py-4',
          textColor,
          { container: isLayoutBlock },
          !fullWidthColor && spacing.bg,
        )}
      >
        <RichText data={richText} enableGutter={false} className={cn(!isLayoutBlock && 'px-4')} />
      </div>
    </div>
  )
}
