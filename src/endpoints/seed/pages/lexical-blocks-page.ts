import type { Event, Media, Post, Sponsor, Tenant } from '@/payload-types'
import { RequiredDataFromCollectionSlug } from 'payload'
import { blockNode, headingNode, paragraphNode, richTextRoot, simpleContent } from '../utilities'

type LexicalBlocksPageArgs = {
  tenant: Tenant
  image1: Media
  posts: Post[]
  events: Event[]
  sponsor: Sponsor
}

export const lexicalBlocksPage = ({
  tenant,
  image1,
  posts,
  events,
  sponsor,
}: LexicalBlocksPageArgs): RequiredDataFromCollectionSlug<'pages'> => {
  return {
    slug: 'lexical-blocks',
    tenant: tenant.id,
    title: 'Lexical Blocks',
    _status: 'published',
    publishedAt: new Date().toISOString(),
    layout: [
      {
        blockType: 'content',
        backgroundColor: 'transparent',
        layout: '1_1',
        blockName: null,
        columns: [
          {
            richText: richTextRoot(
              headingNode('Blocks Embedded in Rich Text', 'h2'),
              paragraphNode(
                'This page tests blocks rendered inside a Lexical rich text field (isLayoutBlock=false), as opposed to the Blocks page where they are top-level layout blocks (isLayoutBlock=true).',
              ),

              // Header block
              headingNode('Header Block', 'h3'),
              blockNode({
                blockType: 'headerBlock',
                richText: simpleContent('An lexical header block'),
                backgroundColor: 'brand-200',
              }),

              // Generic embed
              headingNode('Generic Embed', 'h3'),
              blockNode({
                blockType: 'genericEmbed',
                html: '<div style="padding: 20px; border: 2px solid #3b82f6; border-radius: 8px; background-color: #eff6ff;"><h3 style="color: #3b82f6; margin-top: 0;">Embedded Generic Embed</h3><p>This generic embed is rendered inside rich text.</p></div>',
                backgroundColor: 'transparent',
                alignContent: 'center',
              }),

              // Media block
              headingNode('Media Block', 'h3'),
              blockNode({
                blockType: 'mediaBlock',
                media: image1.id,
                caption: simpleContent('An lexical media block with center alignment'),
                backgroundColor: 'brand-100',
                alignContent: 'center',
                imageSize: 'medium',
              }),

              // Callout block
              headingNode('Callout Block', 'h3'),
              blockNode({
                blockType: 'calloutBlock',
                backgroundColor: 'brand-500',
                callout: simpleContent(
                  'This is a callout block lexical in rich text. It should render without its own container.',
                ),
              }),

              // Blog list (dynamic)
              headingNode('Blog List (Dynamic)', 'h3'),
              blockNode({
                blockType: 'blogList',
                heading: 'Recent Blogs',
                backgroundColor: 'brand-200',
                belowHeadingContent: simpleContent(
                  'A dynamic blog list rendered inside rich text.',
                ),
                postOptions: 'dynamic',
                dynamicOptions: {
                  filterByTags: null,
                  sortBy: '-publishedAt',
                },
                staticOptions: {
                  staticPosts: [],
                },
              }),

              // Single blog post
              headingNode('Single Blog Post', 'h3'),
              blockNode({
                blockType: 'singleBlogPost',
                backgroundColor: 'brand-400',
                post: posts[0]?.id || 0,
              }),

              // Document block (no document to reference, so skip if problematic)

              // Event list (dynamic)
              headingNode('Event List (Dynamic)', 'h3'),
              blockNode({
                blockType: 'eventList',
                heading: 'Upcoming Events',
                backgroundColor: 'brand-500',
                belowHeadingContent: simpleContent(
                  'A dynamic event list rendered inside rich text.',
                ),
                eventOptions: 'dynamic',
                dynamicOpts: {
                  maxEvents: 3,
                },
                staticOpts: {
                  staticEvents: [],
                },
              }),

              // Event table (dynamic)
              headingNode('Event Table (Dynamic)', 'h3'),
              blockNode({
                blockType: 'eventTable',
                backgroundColor: 'transparent',
                eventOptions: 'dynamic',
                dynamicOpts: {
                  maxEvents: 4,
                },
                staticOpts: {
                  staticEvents: [],
                },
              }),

              // Single event
              headingNode('Single Event', 'h3'),
              blockNode({
                blockType: 'singleEvent',
                backgroundColor: 'transparent',
                event: events[0]?.id || 0,
              }),

              // Sponsors block
              headingNode('Sponsors Block', 'h3'),
              blockNode({
                blockType: 'sponsorsBlock',
                backgroundColor: 'brand-100',
                sponsorsLayout: 'static',
                sponsors: [sponsor.id],
              }),

              paragraphNode('End of lexical blocks test page.'),
            ),
          },
        ],
      },
    ],
    meta: {
      image: null,
      description: null,
    },
  }
}
