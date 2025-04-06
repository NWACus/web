import type { StaticImageData } from 'next/image'

import { cn } from 'src/utilities/cn'
import React from 'react'
import RichText from '@/components/RichText'

import type { IconList as IconListProps } from '@/payload-types'

import { Media } from '@/components/Media'

type Props = IconListProps & {
  breakout?: boolean
  captionClassName?: string
  className?: string
  enableGutter?: boolean
  imgClassName?: string
  staticImage?: StaticImageData
  disableInnerContainer?: boolean
}

export const IconList: React.FC<Props> = (props) => {
  const { columns, className, enableGutter = true, imgClassName, staticImage } = props

  const colsClasses = {
    1: '12',
    2: '6',
    3: '4',
    4: '8',
  }

  const colsSpanClasses = colsClasses[columns ? columns.length : 1]

  return (
    <div className="container my-16">
      <div className="grid grid-cols-4 lg:grid-cols-12 gap-y-8 gap-x-16">
        {columns &&
          columns.length > 0 &&
          columns.map((col, index) => {
            const { icon, richText, title } = col

            return (
              <div
                className={cn(
                  `col-span-4 lg:col-span-${colsSpanClasses[colsSpanClasses || 'full']}`,
                  {
                    'md:col-span-2': colsSpanClasses !== 'full',
                  },
                )}
                key={index}
              >
                <div
                  className={cn(
                    {
                      container: enableGutter,
                    },
                    className,
                  )}
                >
                  {(icon || staticImage) && (
                    <Media
                      imgClassName={cn('border border-border rounded-[0.8rem]', imgClassName)}
                      resource={icon}
                      src={staticImage}
                    />
                  )}
                  {title && <div className={cn('mt-6')}>{title}</div>}
                  {richText && (
                    <div className={cn('mt-2')}>
                      <RichText data={richText} enableGutter={false} />
                    </div>
                  )}
                </div>
              </div>
            )
          })}
      </div>
    </div>
  )
}
