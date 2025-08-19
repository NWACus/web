import type { SingleBlogPostBlock } from '@/payload-types'

export const singleBlogPostBlock: SingleBlogPostBlock = {
  blockType: 'singleBlogPost',
  backgroundColor: 'transparent',
  post: 0, // Will be populated with actual post reference during seeding
}
