import type { BlogListBlock } from '@/payload-types'

export const blogListBlock: BlogListBlock = {
  blockType: 'blogList',
  heading: 'Recent Blogs',
  backgroundColor: 'transparent',
  belowHeadingContent: {
    root: {
      type: 'root',
      format: '',
      indent: 0,
      version: 1,
      children: [
        {
          children: [
            {
              detail: 0,
              format: 0,
              mode: 'normal',
              style: '',
              text: 'Stay up to date with the latest news and insights from our avalanche forecasting team.',
              type: 'text',
              version: 1,
            },
          ],
          direction: 'ltr',
          format: '',
          indent: 0,
          type: 'paragraph',
          version: 1,
        },
      ],
      direction: 'ltr',
    },
  },
  postOptions: 'dynamic',
  dynamicOptions: {
    filterByTags: null,
    sortBy: '-publishedAt',
    queriedPosts: [], // Will be populated during seeding
  },
  staticOptions: {
    staticPosts: [], // Will be populated with actual post references during seeding
  },
}
