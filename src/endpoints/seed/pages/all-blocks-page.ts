import type { Media, Post, Tenant } from '@/payload-types'
import { RequiredDataFromCollectionSlug } from 'payload'
import { blogListBlock } from '../blocks/blog-list'
import { contentWithCallout } from '../blocks/content-with-callout'
import { genericEmbed } from '../blocks/generic-embed'
import { imageLinkGrid } from '../blocks/image-link-grid'
import { imageQuote } from '../blocks/image-quote'
import { imageText } from '../blocks/image-text'
import { imageTextList } from '../blocks/image-text-list'
import { linkPreview } from '../blocks/link-preview'
import { singleBlogPostBlock } from '../blocks/single-blog-post'

export const allBlocksPage: (
  tenant: Tenant,
  image1: Media,
  posts: Post[],
) => RequiredDataFromCollectionSlug<'pages'> = (
  tenant: Tenant,
  image1: Media,
  posts: Post[],
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
      ...contentWithCallout,
      ...genericEmbed,
      // dynamic posts
      {
        ...blogListBlock,
      },
      // static posts
      {
        ...blogListBlock,
        staticPosts: posts.slice(0, 2).map((post) => post.id), // Use first 2 posts
      },
      {
        ...singleBlogPostBlock,
        post: posts[0]?.id || 0, // Use first post
      },
    ],
    meta: {
      title: null,
      image: null,
      description: null,
    },
  }
}
