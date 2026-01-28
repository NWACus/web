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
  BuiltInPage,
  ButtonBlock as ButtonBlockProps,
  CalloutBlock as CalloutBlockProps,
  DocumentBlock as DocumentBlockProps,
  EventListBlock as EventListBlockProps,
  EventTableBlock as EventTableBlockProps,
  GenericEmbedBlock as GenericEmbedBlockProps,
  HeaderBlock as HeaderBlockProps,
  MediaBlock as MediaBlockProps,
  Page,
  Post,
  SingleBlogPostBlock as SingleBlogPostBlockProps,
  SingleEventBlock as SingleEventBlockProps,
  SponsorsBlock as SponsorsBlockProps,
} from '@/payload-types'
import { handleReferenceURL } from '@/utilities/handleReferenceURL'
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
  const { linkType, doc, url } = linkNode.fields
  const { value, relationTo } = doc || {}

  if (typeof value !== 'object') {
    throw new Error('Expected value to be an object')
  }

  if (linkType === 'internal') {
    return (
      handleReferenceURL({
        url,
        type: linkType,
        reference: {
          // Need type assertion because of LinkFields types
          // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
          relationTo: relationTo as 'builtInPages' | 'pages' | 'posts',
          // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
          value: value as unknown as BuiltInPage | Page | Post | string | number,
        },
      }) || '/'
    )
  }
  return url || '/'
}

const jsxConverters: JSXConvertersFunction<NodeTypes> = ({ defaultConverters }) => ({
  ...defaultConverters,
  ...LinkJSXConverter({ internalDocToHref }),
  // if block has two variants - to make TS happy we fallback to the default for the block variant
  blocks: {
    blogList: ({ node }) => (
      <BlogListBlockComponent
        {...node.fields}
        wrapInContainer={node.fields.wrapInContainer || false}
      />
    ),
    buttonBlock: ({ node }) => <ButtonBlockComponent {...node.fields} />,
    calloutBlock: ({ node }) => <CalloutBlockComponent {...node.fields} />,
    documentBlock: ({ node }) => (
      <DocumentBlockComponent
        {...node.fields}
        wrapInContainer={node.fields.wrapInContainer || false}
      />
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
      <GenericEmbedBlockComponent
        {...node.fields}
        wrapInContainer={node.fields.wrapInContainer || false}
      />
    ),
    headerBlock: ({ node }) => <HeaderBlockComponent {...node.fields} />,
    mediaBlock: ({ node }) => (
      <MediaBlockComponent
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
