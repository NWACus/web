import type { Event, Media, Post, Tenant } from '@/payload-types'
import { RequiredDataFromCollectionSlug } from 'payload'
import { blogListBlock } from '../blocks/blog-list'
import { contentWithCallout } from '../blocks/content-with-callout'
import { eventListBlock } from '../blocks/event-list'
import { genericEmbed } from '../blocks/generic-embed'
import { imageLinkGrid } from '../blocks/image-link-grid'
import { imageQuote } from '../blocks/image-quote'
import { imageText } from '../blocks/image-text'
import { imageTextList } from '../blocks/image-text-list'
import { linkPreview } from '../blocks/link-preview'
import { mediaBlocks } from '../blocks/media-blocks'
import { singleBlogPostBlock } from '../blocks/single-blog-post'
import { singleEventBlock } from '../blocks/single-event'

export const allBlocksPage: (
  tenant: Tenant,
  image1: Media,
  posts: Post[],
  events: Event[],
) => RequiredDataFromCollectionSlug<'pages'> = (
  tenant: Tenant,
  image1: Media,
  posts: Post[],
  events: Event[],
): RequiredDataFromCollectionSlug<'pages'> => {
  return {
    slug: 'blocks',
    tenant: tenant.id,
    title: 'Blocks',
    _status: 'published',
    publishedAt: new Date().toISOString(),
    layout: [
      ...imageLinkGrid(image1),
      ...imageQuote(image1),
      ...imageText(image1),
      ...imageTextList(image1),
      ...linkPreview(image1),
      ...mediaBlocks(image1),
      ...contentWithCallout,
      ...genericEmbed,
      {
        ...blogListBlock,
        postOptions: 'dynamic',
        dynamicOptions: {
          filterByTags: null,
          sortBy: '-publishedAt',
          queriedPosts: posts.slice(0, 4).map((post) => post.id), // Use first 4 posts for preview
        },
      },
      {
        ...blogListBlock,
        postOptions: 'static',
        staticOptions: {
          staticPosts: posts.slice(0, 2).map((post) => post.id), // Use first 2 posts
        },
      },
      {
        ...singleBlogPostBlock,
        post: posts[0]?.id || 0, // Use first post
      },
      {
        ...eventListBlock,
        eventOptions: 'dynamic',
        dynamicOptions: {
          sortBy: 'startDate',
          showUpcomingOnly: true,
          maxEvents: 4,
          queriedEvents: events.slice(0, 4).map((event) => event.id), // Use first 4 events for preview
        },
      },
      {
        ...eventListBlock,
        eventOptions: 'static',
        staticOptions: {
          staticEvents: events.slice(0, 3).map((event) => event.id), // Use first 3 events
        },
      },
      {
        ...singleEventBlock,
        event: events[0]?.id || 0, // Use first event
      },
      {
        ...singleEventBlock,
        event: events[1]?.id || 0, // Use second event
        backgroundColor: 'gray',
      },
    ],
    meta: {
      image: null,
      description: null,
    },
  }
}
