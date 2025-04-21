import { Fragment } from 'react'

import type { Page } from '@/payload-types'

import { BiographyBlock } from '@/blocks/Biography/Biography'
import { CallToActionBlock } from '@/blocks/CallToAction/Component'
import { ContentBlock } from '@/blocks/Content/Component'
import { FormBlock } from '@/blocks/Form/Component'
import { ImageTextList } from '@/blocks/ImageTextList/Component'
import { MediaBlock } from '@/blocks/MediaBlock/Component'
import { TeamBlock } from '@/blocks/Team/Team'

export const RenderBlocks = (props: { blocks: Page['layout'][0][] }) => {
  const { blocks } = props

  const hasBlocks = blocks && Array.isArray(blocks) && blocks.length > 0

  if (hasBlocks) {
    return (
      <Fragment>
        {blocks.map((block, index) => {
          return (
            <div className="my-16" key={index}>
              <RenderBlock key={index} block={block} />
            </div>
          )
        })}
      </Fragment>
    )
  }

  return null
}

export const RenderBlock = ({ key, block }: { key: number; block: Page['layout'][0] }) => {
  const { blockType } = block
  switch (blockType) {
    case 'biography':
      return <BiographyBlock key={key} {...block} />
    case 'cta':
      return <CallToActionBlock key={key} {...block} />
    case 'content':
      return <ContentBlock key={key} {...block} />
    case 'formBlock':
      return <FormBlock key={key} {...block} />
    case 'imageTextList':
      return <ImageTextList key={key} {...block} />
    case 'mediaBlock':
      return <MediaBlock key={key} {...block} />
    case 'team':
      return <TeamBlock key={key} {...block} />
  }
}
