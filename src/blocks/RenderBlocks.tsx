import { Fragment } from 'react'

import type { Page } from '@/payload-types'
import { Payload } from 'payload'

import { BlogListBlockComponent } from '@/blocks/BlogList/Component'
import { ContentBlockComponent } from '@/blocks/Content/Component'
import { DocumentBlockComponent } from '@/blocks/Document/Component'
import { EventListBlockComponent } from '@/blocks/EventList/Component'
import { EventTableBlockComponent } from '@/blocks/EventTable/Component'
import { FormBlockComponent } from '@/blocks/Form/Component'
import { GenericEmbedBlockComponent } from '@/blocks/GenericEmbed/Component'
import { HeaderBlockComponent } from '@/blocks/Header/Component'
import { ImageLinkGridBlockComponent } from '@/blocks/ImageLinkGrid/Component'
import { ImageTextBlockComponent } from '@/blocks/ImageText/Component'
import { LinkPreviewBlockComponent } from '@/blocks/LinkPreview/Component'
import { MediaBlockComponent } from '@/blocks/Media/Component'
import { NACMediaBlockComponent } from '@/blocks/NACMedia/Component'
import { SingleBlogPostBlockComponent } from '@/blocks/SingleBlogPost/Component'
import { SingleEventBlockComponent } from '@/blocks/SingleEvent/Component'
import { SponsorsBlockComponent } from '@/blocks/Sponsors/components'
import { TeamBlockComponent } from '@/blocks/Team/Component'

export const RenderBlocks = (props: { blocks: Page['layout'][0][]; payload: Payload }) => {
  const { blocks } = props

  const hasBlocks = blocks && Array.isArray(blocks) && blocks.length > 0

  if (hasBlocks) {
    return (
      <Fragment>
        {blocks.map((block) => {
          return (
            <div key={`${block.id}__${block.blockType}`}>
              <RenderBlock block={block} />
            </div>
          )
        })}
      </Fragment>
    )
  }

  return null
}

export const RenderBlock = ({ block }: { block: Page['layout'][0] }) => {
  const { blockType } = block
  // if a block has two variants - to make TS happy we fallback to the default for the block variant
  switch (blockType) {
    case 'blogList':
      return <BlogListBlockComponent {...block} isLayoutBlock={true} />
    case 'content':
      return <ContentBlockComponent {...block} />
    case 'documentBlock':
      return <DocumentBlockComponent {...block} isLayoutBlock={true} />
    case 'eventList':
      return <EventListBlockComponent {...block} isLayoutBlock={true} />
    case 'eventTable':
      return <EventTableBlockComponent {...block} isLayoutBlock={true} />
    case 'formBlock':
      return <FormBlockComponent {...block} />
    case 'genericEmbed':
      return <GenericEmbedBlockComponent {...block} isLayoutBlock={true} />
    case 'headerBlock':
      return <HeaderBlockComponent {...block} isLayoutBlock={true} />
    case 'imageLinkGrid':
      return <ImageLinkGridBlockComponent {...block} />
    case 'imageText':
      return <ImageTextBlockComponent {...block} />
    case 'linkPreview':
      return <LinkPreviewBlockComponent {...block} />
    case 'mediaBlock':
      return <MediaBlockComponent {...block} isLayoutBlock={true} />
    case 'nacMediaBlock':
      return <NACMediaBlockComponent {...block} />
    case 'singleBlogPost':
      return <SingleBlogPostBlockComponent {...block} isLayoutBlock={true} />
    case 'singleEvent':
      return <SingleEventBlockComponent {...block} isLayoutBlock={true} />
    case 'sponsorsBlock':
      return <SponsorsBlockComponent {...block} isLayoutBlock={true} />
    case 'team':
      return <TeamBlockComponent {...block} />
  }
}
