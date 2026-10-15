import { CollectionSlug } from 'payload'

export const LINK_ENABLED_COLLECTIONS = [
  'pages',
  'builtInPages',
  'posts',
  'stationPages',
] as const satisfies CollectionSlug[]
