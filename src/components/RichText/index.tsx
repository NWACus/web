import { MediaBlockComponent } from '@/blocks/Media/Component'
import {
  DefaultNodeTypes,
  SerializedBlockNode,
  SerializedInlineBlockNode,
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
import { FormEmbedBlockComponent } from '@/blocks/FormEmbed/Component'
import { GenericEmbedBlockComponent } from '@/blocks/GenericEmbed/Component'
import { HeaderBlockComponent } from '@/blocks/Header/Component'
import { ImageTextBlockComponent } from '@/blocks/ImageText/Component'
import { InlineMediaComponent } from '@/blocks/InlineMedia/Component'
import { SingleBlogPostBlockComponent } from '@/blocks/SingleBlogPost/Component'
import { SingleEventBlockComponent } from '@/blocks/SingleEvent/Component'
import { SponsorsBlockComponent } from '@/blocks/Sponsors/components'
import { VideoEmbedBlockComponent } from '@/blocks/VideoEmbed/Component'
import type {
  BlogListBlock as BlogListBlockProps,
  ButtonBlock as ButtonBlockProps,
  CalloutBlock as CalloutBlockProps,
  DocumentBlock as DocumentBlockProps,
  EventListBlock as EventListBlockProps,
  EventTableBlock as EventTableBlockProps,
  FormEmbedBlock as FormEmbedBlockProps,
  GenericEmbedBlock as GenericEmbedBlockProps,
  HeaderBlock as HeaderBlockProps,
  ImageTextBlock as ImageTextBlockProps,
  InlineMediaBlock as InlineMediaBlockProps,
  MediaBlock as MediaBlockProps,
  SingleBlogPostBlock as SingleBlogPostBlockProps,
  SingleEventBlock as SingleEventBlockProps,
  SponsorsBlock as SponsorsBlockProps,
  VideoEmbedBlock as VideoEmbedBlockProps,
} from '@/payload-types'
import { cn } from '@/utilities/ui'
import { internalDocToHref } from './internalDocToHref'

type NodeTypes =
  | DefaultNodeTypes
  | SerializedBlockNode<
      | BlogListBlockProps
      | ButtonBlockProps
      | CalloutBlockProps
      | DocumentBlockProps
      | EventListBlockProps
      | EventTableBlockProps
      | FormEmbedBlockProps
      | GenericEmbedBlockProps
      | HeaderBlockProps
      | ImageTextBlockProps
      | MediaBlockProps
      | SingleBlogPostBlockProps
      | SingleEventBlockProps
      | SponsorsBlockProps
      | VideoEmbedBlockProps
    >
  | SerializedInlineBlockNode<InlineMediaBlockProps>

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
    formEmbed: ({ node }) => <FormEmbedBlockComponent {...node.fields} isLayoutBlock={false} />,
    videoEmbed: ({ node }) => <VideoEmbedBlockComponent {...node.fields} isLayoutBlock={false} />,
    headerBlock: ({ node }) => <HeaderBlockComponent {...node.fields} isLayoutBlock={false} />,
    imageText: ({ node }) => <ImageTextBlockComponent {...node.fields} isLayoutBlock={false} />,
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
  inlineBlocks: {
    inlineMedia: ({ node }) => <InlineMediaComponent {...node.fields} />,
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
