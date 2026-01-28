import { CollectionSlug } from 'payload'

export const LINK_ENABLED_COLLECTIONS = [
  'pages',
  'builtInPages',
  'posts',
] as const satisfies CollectionSlug[]
