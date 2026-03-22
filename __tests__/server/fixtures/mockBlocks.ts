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

// Lexical-embedded blocks (used inside richText BlocksFeature, not in DEFAULT_BLOCKS)
export const ButtonBlock = {
  slug: 'buttonBlock',
  fields: [
    {
      type: 'group',
      name: 'button',
      fields: [
        {
          type: 'row',
          fields: [{ type: 'radio', name: 'type' }],
        },
        {
          type: 'row',
          fields: [
            {
              type: 'relationship',
              name: 'reference',
              relationTo: ['pages', 'builtInPages', 'posts'],
            },
            { type: 'text', name: 'url' },
            { type: 'text', name: 'label' },
          ],
        },
      ],
    },
  ],
}

export const CalloutBlock = {
  slug: 'calloutBlock',
  fields: [
    { type: 'richText', name: 'richText' },
    { type: 'text', name: 'style' },
  ],
}
