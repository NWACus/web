import { Fragment } from 'react'

import type { Page } from '@/payload-types'

import { BiographyBlock } from '@/blocks/Biography/Biography'
import { ContentBlock } from '@/blocks/Content/Component'
import { ContentWithCalloutBlock } from '@/blocks/ContentWithCallout/Component'
import { FormBlock } from '@/blocks/Form/Component'
import { ImageLinkGrid } from '@/blocks/ImageLinkGrid/Component'
import { ImageQuote } from '@/blocks/ImageQuote/Component'
import { ImageText } from '@/blocks/ImageText/Component'
import { ImageTextList } from '@/blocks/ImageTextList/Component'
import { LinkPreviewBlock } from '@/blocks/LinkPreview/Component'
import { MediaBlock } from '@/blocks/MediaBlock/Component'
import { TeamBlock } from '@/blocks/Team/Team'
import { Payload } from 'payload'
import { GenericEmbedBlock } from './GenericEmbed/Component'

export const RenderBlocks = (props: { blocks: Page['layout'][0][]; payload: Payload }) => {
  const { blocks } = props

  const hasBlocks = blocks && Array.isArray(blocks) && blocks.length > 0

  if (hasBlocks) {
    return (
      <Fragment>
        {blocks.map((block) => {
          return (
            <div key={`${block.id}__${block.blockType}`}>
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
    case 'contentWithCallout':
      return <ContentWithCalloutBlock {...block} />
    case 'team':
      return <TeamBlock {...block} payload={payload} />
    case 'genericEmbed':
      // src/blocks/GenericEmbed/config.ts has two variants - to make TS happy we fallback to the default for the GenericEmbed variant
      return <GenericEmbedBlock {...block} wrapInContainer={block.wrapInContainer || true} />
  }
}
