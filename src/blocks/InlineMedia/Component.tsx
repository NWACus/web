import type { InlineMediaBlock } from '@/payload-types'

import { Media } from '@/components/Media'
import { cn } from '@/utilities/ui'

type Props = Omit<InlineMediaBlock, 'blockType' | 'id'>

const inlineSizeClasses = {
  small: 'max-h-6',
  medium: 'max-h-10',
  large: 'max-h-16',
  full: 'max-h-24',
} as const

const floatSizeClasses = {
  small: 'max-w-[8rem]',
  medium: 'max-w-[12rem]',
  large: 'max-w-[16rem]',
  full: 'max-w-[24rem]',
} as const

const verticalAlignClasses = {
  top: 'align-top',
  middle: 'align-middle',
  bottom: 'align-bottom',
  baseline: 'align-baseline',
} as const

export const InlineMediaComponent = ({
  media,
  position = 'inline',
  verticalAlign = 'middle',
  size = 'small',
  caption,
}: Props) => {
  if (!media || typeof media === 'number' || typeof media === 'string') {
    return null
  }

  const isFloat = position === 'float-left' || position === 'float-right'

  const sizeClass = isFloat ? floatSizeClasses[size ?? 'small'] : inlineSizeClasses[size ?? 'small']

  const positionClasses = isFloat
    ? cn(position === 'float-left' ? 'float-left mr-2' : 'float-right ml-2', 'mb-1')
    : cn('inline-block', verticalAlignClasses[verticalAlign ?? 'middle'])

  return (
    <span className={positionClasses} title={caption ?? undefined}>
      <Media
        htmlElement="span"
        resource={media}
        imgClassName={cn(sizeClass, isFloat ? 'h-auto' : 'w-auto')}
        sizes={isFloat ? '384px' : '96px'}
      />
    </span>
  )
}
