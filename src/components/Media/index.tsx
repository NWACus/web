import { Fragment } from 'react'

import type { Props } from './types'

import { ImageMedia } from './ImageMedia'
import { VideoMedia } from './VideoMedia'

export const Media = (props: Props & { className?: string }) => {
  const { className, ...childComponentProps } = props
  const { htmlElement = 'div', resource } = childComponentProps

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
      {isVideo ? <VideoMedia {...childComponentProps} /> : <ImageMedia {...childComponentProps} />}
    </Tag>
  )
}
