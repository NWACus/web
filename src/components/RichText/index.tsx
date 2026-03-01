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
import { LINK_ENABLED_COLLECTIONS } from '@/constants/linkCollections'
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

type LinkDocRelationTo = (typeof LINK_ENABLED_COLLECTIONS)[number]
type LinkDocValue = BuiltInPage | Page | Post

type ResolvedLinkDoc = {
  relationTo: LinkDocRelationTo
  value: LinkDocValue
}

// Type guard to validate and narrow link doc type
function isResolvedLinkDoc(doc: unknown): doc is ResolvedLinkDoc {
  if (!doc || typeof doc !== 'object') {
    return false
  }
  if (!('relationTo' in doc) || !('value' in doc)) {
    return false
  }
  const { relationTo, value } = doc
  if (typeof value !== 'object' || value === null) {
    return false
  }
  // Check relationTo is one of the enabled collections
  const enabledCollections: readonly string[] = LINK_ENABLED_COLLECTIONS
  return typeof relationTo === 'string' && enabledCollections.includes(relationTo)
}

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

  if (linkType === 'internal') {
    if (!isResolvedLinkDoc(doc)) {
      throw new Error('Expected doc to be a resolved link document')
    }
    return (
      handleReferenceURL({
        url,
        type: linkType,
        reference: {
          relationTo: doc.relationTo,
          value: doc.value,
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
    blogList: ({ node }) => <BlogListBlockComponent {...node.fields} isLayoutBlock={false} />,
    buttonBlock: ({ node }) => <ButtonBlockComponent {...node.fields} />,
    calloutBlock: ({ node }) => <CalloutBlockComponent {...node.fields} />,
    documentBlock: ({ node }) => <DocumentBlockComponent {...node.fields} isLayoutBlock={false} />,
    eventList: ({ node }) => <EventListBlockComponent {...node.fields} isLayoutBlock={false} />,
    eventTable: ({ node }) => <EventTableBlockComponent {...node.fields} isLayoutBlock={false} />,
    singleEvent: ({ node }) => <SingleEventBlockComponent {...node.fields} isLayoutBlock={false} />,
    genericEmbed: ({ node }) => (
      <GenericEmbedBlockComponent {...node.fields} isLayoutBlock={false} />
    ),
    headerBlock: ({ node }) => <HeaderBlockComponent {...node.fields} isLayoutBlock={false} />,
    mediaBlock: ({ node }) => (
      <MediaBlockComponent
        className="col-start-1 col-span-3"
        imgClassName="m-0"
        {...node.fields}
        isLayoutBlock={false}
        captionClassName="mx-auto max-w-[48rem]"
      />
    ),
    singleBlogPost: ({ node }) => (
      <SingleBlogPostBlockComponent {...node.fields} isLayoutBlock={false} />
    ),
    sponsorsBlock: ({ node }) => <SponsorsBlockComponent {...node.fields} isLayoutBlock={false} />,
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
