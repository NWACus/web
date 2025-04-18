import { Fragment } from 'react'

import type { Page } from '@/payload-types'

import { BiographyBlock } from '@/blocks/Biography/Biography'
import { CallToActionBlock } from '@/blocks/CallToAction/Component'
import { ContentBlock } from '@/blocks/Content/Component'
import { FormBlock } from '@/blocks/Form/Component'
import { ImageTextList } from '@/blocks/ImageTextList/Component'
import { LinkPreviewBlock } from '@/blocks/LinkPreview/Component'
import { MediaBlock } from '@/blocks/MediaBlock/Component'
import { TeamBlock } from '@/blocks/Team/Team'
import { Payload } from 'payload'

export const RenderBlocks = (props: { blocks: Page['layout'][0][]; payload: Payload }) => {
  const { blocks } = props

  const hasBlocks = blocks && Array.isArray(blocks) && blocks.length > 0

  if (hasBlocks) {
    return (
      <Fragment>
        {blocks.map((block) => {
          return (
            <div className="my-16" key={`${block.id}__${block.blockType}`}>
              <RenderBlock block={block} payload={props.payload} />
            </div>
          )
        })}
      </Fragment>
    )
  }

  return null
}

export const RenderBlock = ({ block, payload }: { block: Page['layout'][0]; payload: Payload }) => {
  const { blockType } = block
  switch (blockType) {
    case 'biography':
      return <BiographyBlock {...block} payload={payload} />
    case 'cta':
      return <CallToActionBlock {...block} />
    case 'content':
      return <ContentBlock {...block} />
    case 'formBlock':
      return <FormBlock {...block} />
    case 'imageTextList':
      return <ImageTextList {...block} />
    case 'linkPreviewBlock':
      return <LinkPreviewBlock {...block} />
    case 'mediaBlock':
      return <MediaBlock {...block} />
    case 'team':
      return <TeamBlock {...block} payload={payload} />
  }
}
