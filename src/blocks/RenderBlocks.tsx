import { Fragment } from 'react'

import type { Page } from '@/payload-types'

import { BiographyBlock } from '@/blocks/Biography/Biography'
import { BlogListBlockComponent } from '@/blocks/BlogList/Component'
import { ContentBlock } from '@/blocks/Content/Component'
import { ContentWithCalloutBlock } from '@/blocks/ContentWithCallout/Component'
import { FormBlock } from '@/blocks/Form/Component'
import { GenericEmbedBlock } from '@/blocks/GenericEmbed/Component'
import { HeaderBlockComponent } from '@/blocks/Header/Component'
import { ImageLinkGrid } from '@/blocks/ImageLinkGrid/Component'
import { ImageQuote } from '@/blocks/ImageQuote/Component'
import { ImageText } from '@/blocks/ImageText/Component'
import { ImageTextList } from '@/blocks/ImageTextList/Component'
import { LinkPreviewBlock } from '@/blocks/LinkPreview/Component'
import { MediaBlock } from '@/blocks/MediaBlock/Component'
import { SingleBlogPostBlockComponent } from '@/blocks/SingleBlogPost/Component'
import { SponsorsBlockComponent } from '@/blocks/SponsorsBlock/Component'
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
    case 'blogList':
      // src/blocks/BlogList/config.ts has two variants - to make TS happy we fallback to the default for the BlogListBlock variant
      return <BlogListBlockComponent {...block} wrapInContainer={block.wrapInContainer || true} />
    case 'content':
      return <ContentBlock {...block} />
    case 'contentWithCallout':
      return <ContentWithCalloutBlock {...block} />
    case 'formBlock':
      return <FormBlock {...block} />
    case 'genericEmbed':
      // src/blocks/GenericEmbed/config.ts has two variants - to make TS happy we fallback to the default for the GenericEmbed variant
      return <GenericEmbedBlock {...block} wrapInContainer={block.wrapInContainer || true} />
    case 'headerBlock':
      return <HeaderBlockComponent {...block} />
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
    case 'singleBlogPost':
      // src/blocks/SingleBlogPost/config.ts has two variants - to make TS happy we fallback to the default for the SingleBlogPostBlock variant
      return (
        <SingleBlogPostBlockComponent {...block} wrapInContainer={block.wrapInContainer || true} />
      )
    case 'sponsorsBlock':
      // src/blocks/SponsorsBlock/config.ts has two variants - to make TS happy we fallback to the default for the SponsorsBlock variant
      return <SponsorsBlockComponent {...block} wrapInContainer={block.wrapInContainer || true} />
    case 'team':
      return <TeamBlock {...block} payload={payload} />
  }
}
