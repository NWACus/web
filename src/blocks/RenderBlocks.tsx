import { Fragment } from 'react'

import type { Page } from '@/payload-types'
import { Payload } from 'payload'

import { BlogListBlockComponent } from '@/blocks/BlogList/Component'
import { ContentBlockComponent } from '@/blocks/Content/Component'
import { DocumentBlockComponent } from '@/blocks/Document/Component'
import { EventListBlockComponent } from '@/blocks/EventList/Component'
import { EventTableBlockComponent } from '@/blocks/EventTable/Component'
import { FormBlock } from '@/blocks/Form/Component'
import { GenericEmbedBlockComponent } from '@/blocks/GenericEmbed/Component'
import { HeaderBlockComponent } from '@/blocks/Header/Component'
import { ImageLinkGridBlockComponent } from '@/blocks/ImageLinkGrid/Component'
import { ImageTextBlockComponent } from '@/blocks/ImageText/Component'
import { LinkPreviewBlock } from '@/blocks/LinkPreview/Component'
import { MediaBlock } from '@/blocks/MediaBlock/Component'
import { NACMediaBlockComponent } from '@/blocks/NACMediaBlock/Component'
import { SingleBlogPostBlockComponent } from '@/blocks/SingleBlogPost/Component'
import { SingleEventBlockComponent } from '@/blocks/SingleEvent/Component'
import { SponsorsBlockComponent } from '@/blocks/SponsorsBlock/Component'
import { TeamBlock } from '@/blocks/Team/Team'

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
  // if a block has two variants - to make TS happy we fallback to the default for the block variant
  switch (blockType) {
    case 'blogList':
      return <BlogListBlockComponent {...block} wrapInContainer={block.wrapInContainer || true} />
    case 'content':
      return <ContentBlockComponent {...block} />
    case 'documentBlock':
      return <DocumentBlockComponent {...block} wrapInContainer={block.wrapInContainer || true} />
    case 'eventList':
      return <EventListBlockComponent {...block} wrapInContainer={block.wrapInContainer || true} />
    case 'eventTable':
      return <EventTableBlockComponent {...block} wrapInContainer={block.wrapInContainer || true} />
    case 'formBlock':
      return <FormBlock {...block} />
    case 'genericEmbed':
      return (
        <GenericEmbedBlockComponent {...block} wrapInContainer={block.wrapInContainer || true} />
      )
    case 'headerBlock':
      return <HeaderBlockComponent {...block} />
    case 'imageLinkGrid':
      return <ImageLinkGridBlockComponent {...block} />
    case 'imageText':
      return <ImageTextBlockComponent {...block} />
    case 'linkPreview':
      return <LinkPreviewBlock {...block} />
    case 'mediaBlock':
      return <MediaBlock {...block} wrapInContainer={block.wrapInContainer || true} />
    case 'nacMediaBlock':
      return <NACMediaBlockComponent {...block} />
    case 'singleBlogPost':
      return (
        <SingleBlogPostBlockComponent {...block} wrapInContainer={block.wrapInContainer || true} />
      )
    case 'singleEvent':
      return (
        <SingleEventBlockComponent {...block} wrapInContainer={block.wrapInContainer || true} />
      )
    case 'sponsorsBlock':
      return <SponsorsBlockComponent {...block} />
    case 'team':
      return <TeamBlock {...block} payload={payload} />
  }
}
