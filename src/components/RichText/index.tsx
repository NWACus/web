import { MediaBlock } from '@/blocks/MediaBlock/Component'
import {
  DefaultNodeTypes,
  SerializedBlockNode,
  SerializedLinkNode,
} from '@payloadcms/richtext-lexical'
import { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical'
import {
  JSXConvertersFunction,
  LinkJSXConverter,
  RichText as RichTextLexical,
} from '@payloadcms/richtext-lexical/react'

import { BannerBlock } from '@/blocks/Banner/Component'
import { BlogListBlockComponent } from '@/blocks/BlogList/Component'
import { ButtonBlockComponent } from '@/blocks/Button/Component'
import { CalloutBlock } from '@/blocks/Callout/Component'
import { DocumentBlock } from '@/blocks/DocumentBlock/Component'
import { EventListBlockComponent } from '@/blocks/EventList/Component'
import { EventTableBlockComponent } from '@/blocks/EventTable/Component'
import { GenericEmbedBlock } from '@/blocks/GenericEmbed/Component'
import { HeaderBlockComponent } from '@/blocks/Header/Component'
import { SingleBlogPostBlockComponent } from '@/blocks/SingleBlogPost/Component'
import { SingleEventBlockComponent } from '@/blocks/SingleEvent/Component'
import { SponsorsBlockComponent } from '@/blocks/SponsorsBlock/Component'
import type {
  BannerBlock as BannerBlockProps,
  BlogListBlock as BlogListBlockProps,
  ButtonBlock as ButtonBlockProps,
  CalloutBlock as CalloutBlockProps,
  DocumentBlock as DocumentBlockProps,
  EventListBlock as EventListBlockProps,
  EventTableBlock as EventTableBlockProps,
  GenericEmbedBlock as GenericEmbedBlockProps,
  HeaderBlock as HeaderBlockProps,
  MediaBlock as MediaBlockProps,
  SingleBlogPostBlock as SingleBlogPostBlockProps,
  SingleEventBlock as SingleEventBlockProps,
  SponsorsBlock as SponsorsBlockProps,
} from '@/payload-types'
import { cn } from '@/utilities/ui'

type NodeTypes =
  | DefaultNodeTypes
  | SerializedBlockNode<
      | BannerBlockProps
      | BlogListBlockProps
      | ButtonBlockProps
      | CalloutBlockProps
      | DocumentBlockProps
      | EventListBlockProps
      | EventTableBlockProps
      | GenericEmbedBlockProps
      | HeaderBlockProps
      | MediaBlockProps
      | SingleBlogPostBlockProps
      | SingleEventBlockProps
      | SponsorsBlockProps
    >

const internalDocToHref = ({ linkNode }: { linkNode: SerializedLinkNode }) => {
  const { value, relationTo } = linkNode.fields.doc || {}
  if (typeof value !== 'object') {
    throw new Error('Expected value to be an object')
  }
  const slug = value.slug
  return relationTo === 'posts' ? `/blog/${slug}` : `/${slug}`
}

const jsxConverters: JSXConvertersFunction<NodeTypes> = ({ defaultConverters }) => ({
  ...defaultConverters,
  ...LinkJSXConverter({ internalDocToHref }),
  // if block has two variants - to make TS happy we fallback to the default for the block variant
  blocks: {
    banner: ({ node }) => <BannerBlock className="col-start-2 mb-4" {...node.fields} />,
    blogList: ({ node }) => (
      <BlogListBlockComponent
        {...node.fields}
        wrapInContainer={node.fields.wrapInContainer || false}
      />
    ),
    buttonBlock: ({ node }) => <ButtonBlockComponent {...node.fields} />,
    calloutBlock: ({ node }) => <CalloutBlock {...node.fields} />,
    documentBlock: ({ node }) => (
      <DocumentBlock {...node.fields} wrapInContainer={node.fields.wrapInContainer || false} />
    ),
    eventList: ({ node }) => (
      <EventListBlockComponent
        {...node.fields}
        wrapInContainer={node.fields.wrapInContainer || false}
      />
    ),
    eventTable: ({ node }) => <EventTableBlockComponent {...node.fields} />,
    singleEvent: ({ node }) => (
      <SingleEventBlockComponent
        {...node.fields}
        wrapInContainer={node.fields.wrapInContainer || false}
      />
    ),
    genericEmbed: ({ node }) => (
      <GenericEmbedBlock {...node.fields} wrapInContainer={node.fields.wrapInContainer || false} />
    ),
    headerBlock: ({ node }) => <HeaderBlockComponent {...node.fields} />,
    mediaBlock: ({ node }) => (
      <MediaBlock
        className="col-start-1 col-span-3"
        imgClassName="m-0"
        {...node.fields}
        wrapInContainer={node.fields.wrapInContainer || false}
        captionClassName="mx-auto max-w-[48rem]"
      />
    ),
    singleBlogPost: ({ node }) => (
      <SingleBlogPostBlockComponent
        {...node.fields}
        wrapInContainer={node.fields.wrapInContainer || false}
      />
    ),
    sponsorsBlock: ({ node }) => <SponsorsBlockComponent {...node.fields} />,
  },
})

type Props = {
  data: SerializedEditorState
  enableGutter?: boolean
} & React.HTMLAttributes<HTMLDivElement>

export default function RichText(props: Props) {
  const { className, enableGutter = true, ...rest } = props
  return (
    <RichTextLexical
      converters={jsxConverters}
      className={cn(
        'mx-auto prose md:prose-md dark:prose-invert',
        {
          'container ': enableGutter,
          'max-w-none': !enableGutter,
        },
        className,
      )}
      {...rest}
    />
  )
}
