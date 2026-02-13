import type { Sponsor } from '@/payload-types'
import { RequiredDataFromCollectionSlug } from 'payload'

export const sponsorsBlock = (
  sponsor: Sponsor,
): RequiredDataFromCollectionSlug<'pages'>['layout'] => [
  {
    blockType: 'sponsorsBlock',
    backgroundColor: 'transparent',
    sponsorsLayout: 'static',
    sponsors: [sponsor.id],
  },
  {
    blockType: 'sponsorsBlock',
    backgroundColor: 'brand-100',
    sponsorsLayout: 'carousel',
    sponsors: [sponsor.id],
  },
]
