import type { InlineMediaBlock } from '@/payload-types'

import { Media } from '@/components/Media'
import { cn } from '@/utilities/ui'

type Props = Omit<InlineMediaBlock, 'blockType' | 'id'>

const widthClasses = {
  '25': 'w-1/4',
  '50': 'w-1/2',
  '75': 'w-3/4',
  '100': 'w-full',
}

const verticalAlignClasses = {
  top: 'align-top',
  middle: 'align-middle',
  bottom: 'align-bottom',
  baseline: 'align-baseline',
}

type WidthSize = keyof typeof widthClasses

function isWidthSize(size: string): size is WidthSize {
  return size in widthClasses
}

export const InlineMediaComponent = ({
  media,
  position = 'inline',
  verticalAlign = 'middle',
  size = 'original',
  fixedHeight,
  caption,
}: Props) => {
  if (!media || typeof media === 'number' || typeof media === 'string') {
    return null
  }

  const isFloat = position === 'float-left' || position === 'float-right'
  const resolvedSize = size ?? 'original'

  let sizeClass = ''
  let imgSizeClass = 'w-auto h-auto'
  let sizes = '100vw'
  const isFixedHeight = resolvedSize === 'fixed-height' && fixedHeight

  if (resolvedSize === 'original') {
    sizeClass = 'max-w-fit'
  } else if (isWidthSize(resolvedSize)) {
    sizeClass = widthClasses[resolvedSize]
    imgSizeClass = 'w-full h-auto'
    // Approximate sizes hint for responsive images
    sizes = `${resolvedSize}vw`
  } else if (isFixedHeight) {
    imgSizeClass = 'h-full w-auto'
    sizes = '96px'
  }

  const positionClasses = isFloat
    ? cn(position === 'float-left' ? 'float-left mr-2' : 'float-right ml-2', 'mb-1')
    : cn('inline-block', verticalAlignClasses[verticalAlign ?? 'middle'])

  // For fixed height, wrap Media in a span with explicit height.
  // Descendant selectors propagate height through Media's intermediate span and picture elements.
  const mediaElement = isFixedHeight ? (
    <span
      className="block [&>span]:h-full [&_picture]:h-full"
      style={{ height: `${fixedHeight}px` }}
    >
      <Media
        htmlElement="span"
        resource={media}
        imgClassName={imgSizeClass}
        pictureClassName="my-0"
        sizes={sizes}
      />
    </span>
  ) : (
    <Media
      htmlElement="span"
      resource={media}
      imgClassName={imgSizeClass}
      pictureClassName="my-0"
      sizes={sizes}
    />
  )

  return (
    <span className={cn(positionClasses, sizeClass)}>
      {mediaElement}
      {caption && <span className="block text-xs text-gray-500 mt-0.5">{caption}</span>}
    </span>
  )
}
