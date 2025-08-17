import { Fragment } from 'react'

import { BannerBlock } from '@/blocks/Banner/Component'
import { BiographyBlock } from '@/blocks/Biography/Biography'
import { ContentBlock } from '@/blocks/Content/Component'
import { ContentWithCalloutBlock } from '@/blocks/ContentWithCallout/Component'
import { EventsByGroupBlockComponent } from '@/blocks/EventsByGroup/Component'
import { FormBlock } from '@/blocks/Form/Component'
import { ImageLinkGrid } from '@/blocks/ImageLinkGrid/Component'
import { ImageQuote } from '@/blocks/ImageQuote/Component'
import { ImageText } from '@/blocks/ImageText/Component'
import { ImageTextList } from '@/blocks/ImageTextList/Component'
import { LinkPreviewBlock } from '@/blocks/LinkPreview/Component'
import { MediaBlock } from '@/blocks/MediaBlock/Component'
import { TeamBlock } from '@/blocks/Team/Team'
import { Payload } from 'payload'

export const RenderBlocks = (props: { blocks: unknown[]; payload: Payload }) => {
  const { blocks } = props

  const hasBlocks = blocks && Array.isArray(blocks) && blocks.length > 0

  if (hasBlocks) {
    return (
      <Fragment>
        {blocks.map((block) => {
          const blockData = block as { id: string; blockType: string }
          return (
            <div className="my-16" key={`${blockData.id}__${blockData.blockType}`}>
              <RenderBlock block={block} payload={props.payload} />
            </div>
          )
        })}
      </Fragment>
    )
  }

  return null
}

export const RenderBlock = ({ block, payload }: { block: unknown; payload: Payload }) => {
  const { blockType } = block as { blockType: string }
  switch (blockType) {
    case 'banner':
      return <BannerBlock {...(block as any)} />
    case 'biography':
      return <BiographyBlock {...(block as any)} payload={payload} />
    case 'content':
      return <ContentBlock {...(block as any)} />
    case 'events-by-group':
      return <EventsByGroupBlockComponent {...(block as any)} />
    case 'formBlock':
      return <FormBlock {...(block as any)} />
    case 'imageLinkGrid':
      return <ImageLinkGrid {...(block as any)} />
    case 'imageQuote':
      return <ImageQuote {...(block as any)} />
    case 'imageText':
      return <ImageText {...(block as any)} />
    case 'imageTextList':
      return <ImageTextList {...(block as any)} />
    case 'linkPreview':
      return <LinkPreviewBlock {...(block as any)} />
    case 'mediaBlock':
      return <MediaBlock {...(block as any)} />
    case 'contentWithCallout':
      return <ContentWithCalloutBlock {...(block as any)} />
    case 'team':
      return <TeamBlock {...(block as any)} payload={payload} />
  }
}
