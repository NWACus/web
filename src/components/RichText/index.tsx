import { MediaBlockComponent } from '@/blocks/Media/Component'
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

import { BlogListBlockComponent } from '@/blocks/BlogList/Component'
import { ButtonBlockComponent } from '@/blocks/Button/Component'
import { CalloutBlockComponent } from '@/blocks/Callout/Component'
import { DocumentBlockComponent } from '@/blocks/Document/Component'
import { EventListBlockComponent } from '@/blocks/EventList/Component'
import { EventTableBlockComponent } from '@/blocks/EventTable/Component'
import { GenericEmbedBlockComponent } from '@/blocks/GenericEmbed/Component'
import { HeaderBlockComponent } from '@/blocks/Header/Component'
import { SingleBlogPostBlockComponent } from '@/blocks/SingleBlogPost/Component'
import { SingleEventBlockComponent } from '@/blocks/SingleEvent/Component'
import { SponsorsBlockComponent } from '@/blocks/Sponsors/components'
import type {
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
    blogList: ({ node }) => <BlogListBlockComponent {...node.fields} isLexical={false} />,
    buttonBlock: ({ node }) => <ButtonBlockComponent {...node.fields} />,
    calloutBlock: ({ node }) => <CalloutBlockComponent {...node.fields} />,
    documentBlock: ({ node }) => <DocumentBlockComponent {...node.fields} isLexical={false} />,
    eventList: ({ node }) => <EventListBlockComponent {...node.fields} isLexical={false} />,
    eventTable: ({ node }) => <EventTableBlockComponent {...node.fields} isLexical={false} />,
    singleEvent: ({ node }) => <SingleEventBlockComponent {...node.fields} isLexical={false} />,
    genericEmbed: ({ node }) => <GenericEmbedBlockComponent {...node.fields} isLexical={false} />,
    headerBlock: ({ node }) => <HeaderBlockComponent {...node.fields} isLexical={false} />,
    mediaBlock: ({ node }) => (
      <MediaBlockComponent
        className="col-start-1 col-span-3"
        imgClassName="m-0"
        {...node.fields}
        isLexical={false}
        captionClassName="mx-auto max-w-[48rem]"
      />
    ),
    singleBlogPost: ({ node }) => (
      <SingleBlogPostBlockComponent {...node.fields} isLexical={false} />
    ),
    sponsorsBlock: ({ node }) => <SponsorsBlockComponent {...node.fields} isLexical={false} />,
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
