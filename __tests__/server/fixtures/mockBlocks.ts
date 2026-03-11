// Minimal block configs for testing clearLayoutRelationships.
// These mirror the shape of Payload Block configs without importing from payload.
export const DEFAULT_BLOCKS = [
  {
    slug: 'singleBlogPost',
    fields: [
      { type: 'relationship', name: 'post', relationTo: 'posts' },
      { type: 'text', name: 'backgroundColor' },
    ],
  },
  {
    slug: 'mediaBlock',
    fields: [{ type: 'upload', name: 'media', relationTo: 'media' }],
  },
  {
    slug: 'sponsorsBlock',
    fields: [
      { type: 'relationship', name: 'sponsors', relationTo: 'sponsors', hasMany: true },
      { type: 'text', name: 'sponsorsLayout' },
    ],
  },
  {
    slug: 'singleEvent',
    fields: [
      { type: 'relationship', name: 'event', relationTo: 'events' },
      { type: 'text', name: 'backgroundColor' },
    ],
  },
  {
    slug: 'blogList',
    fields: [
      { type: 'text', name: 'postOptions' },
      {
        type: 'group',
        name: 'staticOptions',
        fields: [{ type: 'relationship', name: 'staticPosts', relationTo: 'posts', hasMany: true }],
      },
    ],
  },
  {
    slug: 'imageLinkGrid',
    fields: [
      {
        type: 'array',
        name: 'columns',
        fields: [
          { type: 'upload', name: 'image', relationTo: 'media' },
          { type: 'text', name: 'caption' },
        ],
      },
    ],
  },
]

export const NACMediaBlock = { slug: 'nacMedia', fields: [] }
