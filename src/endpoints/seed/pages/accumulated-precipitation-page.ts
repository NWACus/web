import type { Media, Tenant } from '@/payload-types'
import type { RequiredDataFromCollectionSlug } from 'payload'

// NWAC's gauges in page order, as the legacy table listed them (checked
// against SnowObs on 2026-09-18). Archived pages' loggers are left out.
const NWAC_PRECIP_STATIONS = [
  '4',
  '5',
  '12',
  '13',
  '50',
  '1',
  '21',
  '28',
  '35',
  '33',
  '39',
  '7',
  '8',
  '48',
  '11',
  '53',
  '43',
  '44',
  '46',
]

export const accumulatedPrecipitationPage = (
  tenant: Tenant,
  seoImage: Media,
): RequiredDataFromCollectionSlug<'pages'> => ({
  slug: 'accumulated-precipitation',
  tenant: tenant.id,
  _status: 'published',
  publishedAt: new Date().toISOString(),
  title: 'Accumulated Precipitation',
  layout: [
    {
      blockType: 'precipTable',
      stations: NWAC_PRECIP_STATIONS.map((stid) => ({ stid, source: 'nwac' })),
    },
  ],
  meta: {
    description: 'Precipitation totals over the last 72 hours at NWAC weather stations.',
    image: seoImage.id,
  },
})
