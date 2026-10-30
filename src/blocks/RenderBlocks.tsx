import { Fragment } from 'react'

import type { HomePage, Page } from '@/payload-types'
import { Payload } from 'payload'

import { BlogListBlockComponent } from '@/blocks/BlogList/Component'
import { ContentBlockComponent } from '@/blocks/Content/Component'
import { DocumentBlockComponent } from '@/blocks/Document/Component'
import { EventListBlockComponent } from '@/blocks/EventList/Component'
import { EventTableBlockComponent } from '@/blocks/EventTable/Component'
import { FormBlockComponent } from '@/blocks/Form/Component'
import { FormEmbedBlockComponent } from '@/blocks/FormEmbed/Component'
import { GalleryBlockComponent } from '@/blocks/Gallery/Component'
import { GenericEmbedBlockComponent } from '@/blocks/GenericEmbed/Component'
import { HeaderBlockComponent } from '@/blocks/Header/Component'
import { ImageLinkGridBlockComponent } from '@/blocks/ImageLinkGrid/Component'
import { ImageTextBlockComponent } from '@/blocks/ImageText/Component'
import { LinkPreviewBlockComponent } from '@/blocks/LinkPreview/Component'
import { MediaBlockComponent } from '@/blocks/Media/Component'
import { NACMediaBlockComponent } from '@/blocks/NACMedia/Component'
import { ObservationsWidgetBlockComponent } from '@/blocks/ObservationsWidget/Component'
import { PrecipTableBlockComponent } from '@/blocks/PrecipTable/Component'
import { SingleBlogPostBlockComponent } from '@/blocks/SingleBlogPost/Component'
import { SingleEventBlockComponent } from '@/blocks/SingleEvent/Component'
import { SponsorsBlockComponent } from '@/blocks/Sponsors/components'
import { TeamBlockComponent } from '@/blocks/Team/Component'
import { VideoEmbedBlockComponent } from '@/blocks/VideoEmbed/Component'
import { cn } from '@/utilities/ui'

type LayoutBlock = Page['layout'][number] | HomePage['layout'][number]

// Margins, so neighbors collapse and the larger of the two settings sets the gap
const spaceAbove: Record<string, string> = {
  none: 'mt-0 md:mt-0',
  sm: 'mt-3 md:mt-5',
  md: 'mt-6 md:mt-10',
  lg: 'mt-12 md:mt-20',
}
const spaceBelow: Record<string, string> = {
  none: 'mb-0 md:mb-0',
  sm: 'mb-3 md:mb-5',
  md: 'mb-6 md:mb-10',
  lg: 'mb-12 md:mb-20',
}

export const RenderBlocks = (props: { blocks: LayoutBlock[]; payload: Payload }) => {
  const { blocks } = props

  const hasBlocks = blocks && Array.isArray(blocks) && blocks.length > 0

  if (hasBlocks) {
    return (
      <Fragment>
        {blocks.map((block) => {
          return (
            <div
              key={`${block.id}__${block.blockType}`}
              className={cn(
                spaceAbove[block.spacingTop ?? 'sm'],
                spaceBelow[block.spacingBottom ?? 'sm'],
              )}
            >
              <RenderBlock block={block} />
            </div>
          )
        })}
      </Fragment>
    )
  }

  return null
}

// One switch case per block type; the branch count grows with the block list by design
// fallow-ignore-next-line complexity
export const RenderBlock = ({ block }: { block: LayoutBlock }) => {
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
    case 'formEmbed':
      return <FormEmbedBlockComponent {...block} isLayoutBlock={true} />
    case 'gallery':
      return <GalleryBlockComponent {...block} />
    case 'videoEmbed':
      return <VideoEmbedBlockComponent {...block} isLayoutBlock={true} />
    case 'headerBlock':
      return <HeaderBlockComponent {...block} isLayoutBlock={true} />
    case 'imageLinkGrid':
      return <ImageLinkGridBlockComponent {...block} />
    case 'imageText':
      return <ImageTextBlockComponent {...block} isLayoutBlock={true} />
    case 'linkPreview':
      return <LinkPreviewBlockComponent {...block} />
    case 'mediaBlock':
      return <MediaBlockComponent {...block} isLayoutBlock={true} />
    case 'nacMediaBlock':
      return <NACMediaBlockComponent {...block} />
    case 'observationsWidget':
      return <ObservationsWidgetBlockComponent {...block} isLayoutBlock={true} />
    case 'precipTable':
      return <PrecipTableBlockComponent {...block} />
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
