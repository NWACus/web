import type { Event, Form, Media, Post, Sponsor, Team, Tenant } from '@/payload-types'
import { RequiredDataFromCollectionSlug } from 'payload'
import { blogListBlock } from '../blocks/blog-list'
import { contentColumns } from '../blocks/content-columns'
import { contentWithCallout } from '../blocks/content-with-callout'
import { eventListBlock } from '../blocks/event-list'
import { formBlock } from '../blocks/form'
import { genericEmbed } from '../blocks/generic-embed'
import { headerBlock } from '../blocks/header'
import { imageLinkGrid } from '../blocks/image-link-grid'
import { imageText } from '../blocks/image-text'
import { linkPreview } from '../blocks/link-preview'
import { mediaBlocks } from '../blocks/media-blocks'
import { nacMediaBlocks } from '../blocks/nac-media'
import { singleBlogPostBlock } from '../blocks/single-blog-post'
import { singleEventBlock } from '../blocks/single-event'
import { sponsorsBlock } from '../blocks/sponsors'
import { teamBlock } from '../blocks/team'
import { headingContent } from '../utilities'

type AllBlocksPageArgs = {
  tenant: Tenant
  image1: Media
  posts: Post[]
  events: Event[]
  contactForm: Form
  teams: Team[]
  sponsor: Sponsor
}

const sectionLabel = (text: string): RequiredDataFromCollectionSlug<'pages'>['layout'][0] => ({
  blockType: 'headerBlock',
  backgroundColor: 'transparent',
  blockName: null,
  richText: headingContent(text, 'h2'),
})

export const allBlocksPage = ({
  tenant,
  image1,
  posts,
  events,
  contactForm,
  teams,
  sponsor,
}: AllBlocksPageArgs): RequiredDataFromCollectionSlug<'pages'> => {
  return {
    slug: 'blocks',
    tenant: tenant.id,
    title: 'Blocks',
    _status: 'published',
    publishedAt: new Date().toISOString(),
    layout: [
      sectionLabel('Header Block'),
      ...headerBlock,
      sectionLabel('Content Columns'),
      ...contentColumns,
      sectionLabel('Image Link Grid'),
      ...imageLinkGrid(image1),
      sectionLabel('Image Text'),
      ...imageText(image1),
      sectionLabel('Link Preview'),
      ...linkPreview(image1),
      sectionLabel('Media Block'),
      ...mediaBlocks(image1),
      sectionLabel('Content with Callout'),
      ...contentWithCallout,
      sectionLabel('Generic Embed'),
      ...genericEmbed,
      sectionLabel('NAC Media Block'),
      ...nacMediaBlocks,
      sectionLabel('Blog List (Dynamic)'),
      {
        ...blogListBlock,
        postOptions: 'dynamic',
        dynamicOptions: {
          filterByTags: null,
          sortBy: '-publishedAt',
        },
      },
      sectionLabel('Blog List (Static)'),
      {
        ...blogListBlock,
        postOptions: 'static',
        staticOptions: {
          staticPosts: posts.slice(0, 2).map((post) => post.id), // Use first 2 posts
        },
      },
      sectionLabel('Single Blog Post'),
      {
        ...singleBlogPostBlock,
        post: posts[0]?.id || 0, // Use first post
      },
      sectionLabel('Event List (Dynamic)'),
      {
        ...eventListBlock,
        eventOptions: 'dynamic',
        dynamicOpts: {
          maxEvents: 4,
        },
      },
      sectionLabel('Event List (Static)'),
      {
        ...eventListBlock,
        eventOptions: 'static',
        staticOpts: {
          staticEvents: events.slice(0, 3).map((event) => event.id), // Use first 3 events
        },
      },
      sectionLabel('Single Event'),
      {
        ...singleEventBlock,
        event: events[0]?.id || 0, // Use first event
      },
      {
        ...singleEventBlock,
        event: events[1]?.id || 0, // Use second event
        backgroundColor: 'gray',
      },
      sectionLabel('Event Table'),
      {
        blockName: '',
        eventOptions: 'dynamic',
        dynamicOpts: {
          maxEvents: 6,
        },
        staticOpts: {
          staticEvents: [],
        },
        blockType: 'eventTable',
        backgroundColor: 'transparent',
      },
      sectionLabel('Form Block'),
      formBlock(contactForm),
      sectionLabel('Sponsors Block'),
      ...sponsorsBlock(sponsor),
      ...(teams.length > 0 ? [sectionLabel('Team Block'), teamBlock(teams[0])] : []),
    ],
    meta: {
      image: null,
      description: null,
    },
  }
}
