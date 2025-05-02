import { Fragment } from 'react'

import type { Page } from '@/payload-types'

import { BiographyBlock } from '@/blocks/Biography/Biography'
import { ButtonBlock } from '@/blocks/Button/Component'
import { ContentBlock } from '@/blocks/Content/Component'
import { FormBlock } from '@/blocks/Form/Component'
import { ImageLinkGrid } from '@/blocks/ImageLinkGrid/Component'
import { ImageQuote } from '@/blocks/ImageQuote/Component'
import { ImageText } from '@/blocks/ImageText/Component'
import { ImageTextList } from '@/blocks/ImageTextList/Component'
import { LinkPreviewBlock } from '@/blocks/LinkPreview/Component'
import { MediaBlock } from '@/blocks/MediaBlock/Component'
import { MembershipBlock } from '@/blocks/Membership/Component'
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
    case 'buttons':
      return <ButtonBlock {...block} />
    case 'content':
      return <ContentBlock {...block} />
    case 'formBlock':
      return <FormBlock {...block} />
    case 'imageLinkGrid':
      return <ImageLinkGrid {...block} />
    case 'imageQuote':
      return <ImageQuote {...block} />
    case 'imageText':
      return <ImageText {...block} />
    case 'imageTextList':
      return <ImageTextList {...block} />
    case 'linkPreview':
      return <LinkPreviewBlock {...block} />
    case 'mediaBlock':
      return <MediaBlock {...block} />
    case 'membership':
      return <MembershipBlock {...block} />
    case 'team':
      return <TeamBlock {...block} payload={payload} />
  }
}
