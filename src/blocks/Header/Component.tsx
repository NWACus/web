import RichText from '@/components/RichText'
import type { HeaderBlock as HeaderBlockProps } from '@/payload-types'
import getTextColorFromBgColor from '@/utilities/getTextColorFromBgColor'
import { cn } from '@/utilities/ui'

type Props = HeaderBlockProps & {
  wrapInContainer: boolean
  fullWidthColor?: boolean
}

export const HeaderBlockComponent = (props: Props) => {
  const { backgroundColor, fullWidthColor, richText, wrapInContainer } = props

  const bgColorClass = `bg-${backgroundColor}`
  const textColor = getTextColorFromBgColor(backgroundColor)

  return (
    <div className={cn(fullWidthColor && bgColorClass)}>
      <div
        className={cn(
          'py-4 w-full',
          textColor,
          { container: wrapInContainer },
          !fullWidthColor && `${bgColorClass}`,
        )}
      >
        <RichText data={richText} enableGutter={false} className={cn(!wrapInContainer && 'px-4')} />
      </div>
    </div>
  )
}
