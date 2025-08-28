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
import { ButtonsBlock } from '@/blocks/Buttons/Component'
import { GenericEmbedBlock } from '@/blocks/GenericEmbed/Component'
import { SingleBlogPostBlockComponent } from '@/blocks/SingleBlogPost/Component'
import { SponsorsBlockComponent } from '@/blocks/SponsorsBlock/Component'
import type {
  BannerBlock as BannerBlockProps,
  BlogListBlock as BlogListBlockProps,
  ButtonsBlock as ButtonsBlockProps,
  GenericEmbedBlock as GenericEmbedBlockProps,
  MediaBlock as MediaBlockProps,
  SingleBlogPostBlock,
  SponsorsBlock as SponsorsBlockProps,
} from '@/payload-types'
import { cn } from '@/utilities/ui'

type NodeTypes =
  | DefaultNodeTypes
  | SerializedBlockNode<
      | BannerBlockProps
      | BlogListBlockProps
      | ButtonsBlockProps
      | GenericEmbedBlockProps
      | MediaBlockProps
      | SingleBlogPostBlock
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
  blocks: {
    banner: ({ node }) => <BannerBlock className="col-start-2 mb-4" {...node.fields} />,
    buttonsBlock: ({ node }) => <ButtonsBlock {...node.fields} />,
    mediaBlock: ({ node }) => (
      <MediaBlock
        className="col-start-1 col-span-3"
        imgClassName="m-0"
        {...node.fields}
        captionClassName="mx-auto max-w-[48rem]"
        enableGutter={false}
        disableInnerContainer={true}
      />
    ),
    genericEmbed: ({ node }) => (
      <GenericEmbedBlock
        {...node.fields}
        // src/blocks/GenericEmbed/config.ts has two variants - to make TS happy we fallback to the default for the GenericEmbedLexical variant
        wrapInContainer={node.fields.wrapInContainer || false}
      />
    ),
    blogList: ({ node }) => (
      <BlogListBlockComponent
        {...node.fields}
        // src/blocks/BlogList/config.ts has two variants - to make TS happy we fallback to the default for the BlogListBlockLexical variant
        wrapInContainer={node.fields.wrapInContainer || false}
      />
    ),
    singleBlogPost: ({ node }) => (
      <SingleBlogPostBlockComponent
        {...node.fields}
        // src/blocks/SingleBlogPost/config.ts has two variants - to make TS happy we fallback to the default for the SingleBlogPostBlockLexical variant
        wrapInContainer={node.fields.wrapInContainer || false}
      />
    ),
    sponsorsBlock: ({ node }) => (
      <SponsorsBlockComponent
        {...node.fields}
        // src/blocks/SponsorsBlock/config.ts has two variants - to make TS happy we fallback to the default for the SponsorsBlockLexical variant
        wrapInContainer={node.fields.wrapInContainer || false}
      />
    ),
  },
})

type Props = {
  data: SerializedEditorState
  enableGutter?: boolean
  enableProse?: boolean
} & React.HTMLAttributes<HTMLDivElement>

export default function RichText(props: Props) {
  const { className, enableProse = true, enableGutter = true, ...rest } = props
  return (
    <RichTextLexical
      converters={jsxConverters}
      className={cn(
        {
          'container ': enableGutter,
          'max-w-none': !enableGutter,
          'mx-auto prose md:prose-md dark:prose-invert': enableProse,
        },
        className,
      )}
      {...rest}
    />
  )
}
