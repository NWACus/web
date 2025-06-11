import { Fragment } from 'react'

import type { Props } from './types'

import { ImageMedia } from './ImageMedia'
import { VideoMedia } from './VideoMedia'

export const Media = (props: Props & { className?: string }) => {
  const { className, ...restProps } = props
  const { htmlElement = 'div', resource } = restProps

  const isVideo = typeof resource === 'object' && resource?.mimeType?.includes('video')
  const Tag = htmlElement || Fragment

  return (
    <Tag
      {...(htmlElement !== null
        ? {
            className,
          }
        : {})}
    >
      {isVideo ? <VideoMedia {...restProps} /> : <ImageMedia {...restProps} />}
    </Tag>
  )
}
